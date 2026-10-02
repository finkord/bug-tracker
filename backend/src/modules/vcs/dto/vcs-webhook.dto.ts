import { IsOptional, IsString } from 'class-validator';

export class GithubWebhookPayloadDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  number?: number;

  @IsOptional()
  pull_request?: {
    html_url: string;
    title: string;
    body?: string | null;
    state: string;
    merged?: boolean;
    head: { ref: string };
    base: { ref: string };
    user?: { login: string };
  };

  @IsOptional()
  repository?: {
    full_name: string;
  };
}

export class GitlabWebhookPayloadDto {
  @IsOptional()
  @IsString()
  object_kind?: string;

  @IsOptional()
  object_attributes?: {
    id: number;
    iid: number;
    title: string;
    description?: string | null;
    source_branch: string;
    target_branch: string;
    state: string;
    action?: string;
    url: string;
  };

  @IsOptional()
  project?: {
    path_with_namespace: string;
  };

  @IsOptional()
  user?: {
    username: string;
  };
}
