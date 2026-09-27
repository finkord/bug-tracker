import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  let mockRequest: {
    url: string;
    method: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockRequest = {
      url: '/api/v1/test',
      method: 'GET',
    };
    mockArgumentsHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle standard HttpException with string message', () => {
    const inputException = new HttpException('Resource not found', HttpStatus.NOT_FOUND);
    filter.catch(inputException, mockArgumentsHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        path: '/api/v1/test',
        message: 'Resource not found',
      }),
    );
  });

  it('should handle standard HttpException with object response', () => {
    const inputException = new HttpException(
      { message: ['Field is required', 'Field must be email'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(inputException, mockArgumentsHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/api/v1/test',
        message: ['Field is required', 'Field must be email'],
      }),
    );
  });

  it('should handle unhandled unexpected generic errors with 500 status', () => {
    const inputException = new Error('Database connection failed');
    filter.catch(inputException, mockArgumentsHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/api/v1/test',
        message: 'Internal server error occurred.',
      }),
    );
  });
});
