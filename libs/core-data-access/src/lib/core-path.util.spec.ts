import { encodePathSegment } from './core-path.util';

describe('encodePathSegment', () => {
  it('keeps reserved characters inside one URL segment', () => {
    expect(encodePathSegment('account/code ?#')).toBe('account%2Fcode%20%3F%23');
  });

  it('does not double-encode an ordinary identifier', () => {
    expect(encodePathSegment('CO-001')).toBe('CO-001');
  });
});
