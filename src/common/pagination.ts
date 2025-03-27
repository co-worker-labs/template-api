import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class PageQuery {
  constructor(
    private pageNo: number,
    private pageSize: number,
  ) {}

  getPageNo() {
    return this.pageNo;
  }

  getSkip() {
    return (this.getPageNo() - 1) * this.pageSize;
  }

  getTake() {
    return this.pageSize;
  }
}

export class PageResult<T> {
  total: number;
  hasMore: boolean;
  list: T[];

  constructor(total: number, list: T[], hasMore: boolean) {
    this.total = total;
    this.hasMore = hasMore;
    this.list = list;
  }
}

export class PageResultForApp<T> {
  hasMore: boolean;
  list: T[];

  constructor(list: T[], hasMore: boolean) {
    this.hasMore = hasMore;
    this.list = list || [];
  }
}

export function getPageResult<T>(
  pageQuery: PageQuery,
  total: number,
  list: T[],
  count: number = 0, // 兼容 count 与 list 长度不一致 的情况
) {
  const hasMore = total > pageQuery.getSkip() + (count || list?.length || 0);
  return new PageResult(total, list, hasMore);
}

export const PageQueryParam = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const { pageNo, pageSize } = request.query;

    let finalPage = parseInt(pageNo) || 1;
    let finalSize = parseInt(pageSize) || 20;
    if (finalPage < 1) {
      finalPage = 1;
    }
    if (finalSize <= 0 || finalSize > 100) {
      finalSize = 20;
    }
    return new PageQuery(finalPage, finalSize);
  },
);
