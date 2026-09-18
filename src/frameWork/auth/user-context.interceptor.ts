import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { userContextStorage } from './user-context.storage.js';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId =
      request.user?.userId ||
      request.user?.id ||
      request.headers['user-id'] ||
      request.headers['x-user-id'] ||
      null;

    // Se não houver ID, segue a requisição sem contexto
    if (!userId) {
      return next.handle();
    }

    // Encapsula a execução e a subscrição do Observable dentro do ALS
    return new Observable((subscriber) => {
      userContextStorage.run({ userId }, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}