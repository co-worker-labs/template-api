import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class TsPageQuery {
  constructor(
    private start: number,
    private pageSize: number,
  ) {}

  getStart() {
    return this.start;
  }

  isNew() {
    return !this.start;
  }

  getTake() {
    return this.pageSize;
  }

  getTakePlus1() {
    return this.pageSize + 1;
  }
}

export class TsPageResult<T> {
  has_more: boolean;
  next: number;
  list: T[];

  constructor(list: T[], next: number) {
    this.has_more = !!next;
    this.next = next;
    this.list = list;
  }

  static ofPlus<T>(
    pageQuery: TsPageQuery,
    list: T[],
    nextFn: (list: T[]) => number,
  ) {
    const next =
      (list?.length || 0) >= pageQuery.getTakePlus1() ? nextFn(list) : null;
    return new TsPageResult<T>(next ? list.slice(1) : list, next);
  }

  static of<T>(
    pageQuery: TsPageQuery,
    list: T[],
    nextFn: (list: T[]) => number,
  ) {
    const next =
      (list?.length || 0) >= pageQuery.getTake() ? nextFn(list) : null;
    return new TsPageResult<T>(list, next);
  }
}

export const TsPageQueryParam = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const { start, limit } = request.query;

    let finalStart: number = 0;
    if (start) {
      finalStart = Number(start);
    }

    let finalSize = parseInt(limit) || 20;

    if (finalSize <= 0 || finalSize > 100) {
      finalSize = 10;
    }
    return new TsPageQuery(finalStart, finalSize);
  },
);
