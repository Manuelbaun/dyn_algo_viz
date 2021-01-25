export class TimeSeries<T> {
  ts: number[] = [];
  data: T[] = [];

  add(ts: number, data: T) {
    this.ts.push(ts);
    this.data.push(data);
  }

  getAtTime(ts: number) {
    const index = this.indexOfNearestLessThan(ts);
    return this.data[index];
  }

  // https://gist.github.com/robertleeplummerjr/1cc657191d34ecd0a324
  private indexOfNearestLessThan(needle: number) {
    if (this.ts.length === 0) return -1;

    var high = this.ts.length - 1,
      low = 0,
      mid,
      item,
      target = -1;

    if (this.ts[high] < needle) {
      return high;
    }

    while (low <= high) {
      mid = (low + high) >> 1;
      item = this.ts[mid];
      if (item > needle) {
        high = mid - 1;
      } else if (item < needle) {
        target = mid;
        low = mid + 1;
      } else {
        return low;
      }
    }

    return target;
  }
}
