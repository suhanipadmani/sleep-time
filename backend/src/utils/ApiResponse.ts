export class ApiResponse<T> {
  public success: boolean;

  constructor(
    public statusCode: number,
    public message: string,
    public data?: T
  ) {
    this.success = statusCode < 400;
  }
}
