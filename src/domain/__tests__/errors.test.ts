import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
} from "../errors";

describe("AppError hierarchy", () => {
  it("AppError has default status 400", () => {
    const err = new AppError("bad input");
    expect(err.message).toBe("bad input");
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("AppError");
    expect(err).toBeInstanceOf(Error);
  });

  it("AppError accepts custom status code", () => {
    const err = new AppError("teapot", 418);
    expect(err.statusCode).toBe(418);
  });

  it("NotFoundError has status 404", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Not found");
    expect(err.statusCode).toBe(404);
    expect(err).toBeInstanceOf(AppError);
  });

  it("NotFoundError accepts custom message", () => {
    const err = new NotFoundError("Farm not found");
    expect(err.message).toBe("Farm not found");
    expect(err.statusCode).toBe(404);
  });

  it("ForbiddenError has status 403", () => {
    const err = new ForbiddenError();
    expect(err.message).toBe("Forbidden");
    expect(err.statusCode).toBe(403);
    expect(err).toBeInstanceOf(AppError);
  });

  it("ConflictError has status 409", () => {
    const err = new ConflictError("Already exists");
    expect(err.message).toBe("Already exists");
    expect(err.statusCode).toBe(409);
    expect(err).toBeInstanceOf(AppError);
  });

  it("UnauthorizedError has status 401", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Unauthorized");
    expect(err.statusCode).toBe(401);
    expect(err).toBeInstanceOf(AppError);
  });
});
