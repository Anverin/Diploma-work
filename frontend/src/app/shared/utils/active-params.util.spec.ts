import {ActiveParamsUtil} from "./active-params.util";

describe('active-params util', () => {

  it('should change page string to int', () => {
    const result = ActiveParamsUtil.processParams({
      page: '2'
    });

    expect(result.page).toBe(2);
  });

  it('should change type string to type array', () => {
    const result = ActiveParamsUtil.processParams({
      categories: 'dizain'
    });

    expect(result.categories).toBeInstanceOf(Array);
  });

  it('should return ActiveParamsType', () => {
    const result = ActiveParamsUtil.processParams({
      page: '2',
      categories: 'dizain'
    });

    expect(result).toEqual({
      page: 2,
      categories: ['dizain']
    });
  });

  it('should return page string', () => {
    const result: any = ActiveParamsUtil.processParams({
      pages: '2'
    });

    expect(result.pages).toBeUndefined();
  });
});
