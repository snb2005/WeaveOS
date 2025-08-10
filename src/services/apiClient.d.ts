/**
 * TypeScript declarations for apiClient.js
 */

export interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  isFolder: boolean;
  uploadDate: string;
  parent?: string | null;
  mimeType?: string;
}

export interface UserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: any;
  token: string;
  message?: string;
}

export interface FilesResponse {
  success: boolean;
  files: FileItem[];
  message?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

declare class ApiClient {
  token: string | null;

  constructor();
  
  getHeaders(includeAuth?: boolean): Record<string, string>;
  handleResponse(response: Response): Promise<any>;
  setToken(token: string | null): void;

  // Authentication methods
  register(userData: UserData): Promise<AuthResponse>;
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<ApiResponse>;
  getCurrentUser(): Promise<ApiResponse>;
  changePassword(passwordData: any): Promise<ApiResponse>;

  // User management methods
  getUserProfile(): Promise<ApiResponse>;
  updateUserProfile(profileData: any): Promise<ApiResponse>;
  getUserStorage(): Promise<ApiResponse>;
  searchUsers(query: string, limit?: number): Promise<ApiResponse>;

  // File management methods
  getFiles(parentId?: string | null): Promise<FilesResponse>;
  uploadFile(file: File, parentId?: string | null): Promise<ApiResponse>;
  downloadFile(fileId: string): Promise<Blob>;
  getFileContent(fileId: string): Promise<{ content: string; filename: string; path: string; size: number; mimeType: string }>;
  updateFileContent(fileId: string, content: string): Promise<ApiResponse>;
  createFolder(name: string, parentId?: string | null): Promise<ApiResponse>;
  deleteFile(fileId: string): Promise<ApiResponse>;
  renameFile(fileId: string, newName: string): Promise<ApiResponse>;
  moveFile(fileId: string, newParentId: string): Promise<ApiResponse>;

  // File sharing methods
  shareFile(fileId: string, userId: string, permissions: any): Promise<ApiResponse>;
  revokeFileSharing(fileId: string, userId: string): Promise<ApiResponse>;
  getSharedWithMe(): Promise<ApiResponse>;
  getSharedByMe(): Promise<ApiResponse>;

  // Admin methods
  getAllUsers(page?: number, limit?: number, search?: string, status?: string): Promise<ApiResponse>;
  updateUserStatus(userId: string, isActive: boolean): Promise<ApiResponse>;
  updateUserQuota(userId: string, storageQuota: number): Promise<ApiResponse>;

  // Health check
  healthCheck(): Promise<ApiResponse>;
}

declare const apiClient: ApiClient;
export default apiClient;
