import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntArrayPipe implements PipeTransform {
  transform(value: string | Array<string>): Array<number> {
    if (!value) {
      throw new BadRequestException('Query parameter is required');
    }
    const array = Array.isArray(value) ? value : value.split(',');
    return array.map((item) => {
      const num = parseInt(item, 10);
      if (isNaN(num)) {
        throw new BadRequestException(`Invalid number: ${item}`);
      }
      return num;
    });
  }
}
