export type GetPreAndPostDisplayOrder = () => Promise<{
  preOrder: number;
  postOrder: number;
}>;

export type ResetOrder = (step: number) => Promise<void>;

export type CurrentMaxOrder = () => Promise<number>;

const DISPLAY_ORDER_STEP = 1024;
const DISPLAY_ORDER_MAX = 2 ** 31 - 1;

export interface OrderOption {
  step: number;
  maxOrder: number;
}

export async function calcDisplayOrder(
  maxFn: CurrentMaxOrder,
  preAndPostFn: GetPreAndPostDisplayOrder,
  resetFn: ResetOrder,
  option?: OrderOption,
): Promise<number> {
  const step = option?.step || DISPLAY_ORDER_STEP;
  const maxOrder = option?.maxOrder || DISPLAY_ORDER_MAX;
  let displayOrder: number;

  let retries = 0;
  // 防止死循环
  while (retries < 2) {
    const { preOrder, postOrder } = await preAndPostFn();

    if (preOrder && postOrder) {
      displayOrder = Math.floor((preOrder + postOrder) / 2);
      if (postOrder <= displayOrder + 1 || displayOrder <= preOrder + 1) {
        retries++;
        await resetFn(step);
        continue;
      }
    } else if (preOrder) {
      displayOrder = preOrder + step;
      if (displayOrder >= maxOrder) {
        retries++;
        await resetFn(step);
        continue;
      }
    } else if (postOrder) {
      displayOrder = Math.floor(postOrder / 2);
      if (displayOrder < 2) {
        retries++;
        await resetFn(step);
        continue;
      }
    } else {
      const maxDisplayOrder = await maxFn();
      displayOrder = maxDisplayOrder + step;
      if (displayOrder >= maxOrder) {
        retries++;
        await resetFn(step);
        continue;
      }
    }
    break;
  }
  return displayOrder;
}
