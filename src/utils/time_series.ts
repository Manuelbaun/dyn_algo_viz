export class TimeSeries<T> {
  ts: number[] = [];
  data: T[] = [];

  add(ts: number, data: T) {
    this.ts.push(ts);
    this.data.push(data);
  }

  getAtTime(ts: number) {
    const index = this.binarySearch(ts);
    return this.data[index];
  }

  private binarySearch(el: number) {
    var m = 0;
    var length = this.ts.length - 1;
    var k = 0;
    while (m <= length) {
      k = (length + m) >> 1;

      var cmp = el - this.ts[k];

      if (cmp > 0) {
        m = k + 1;
      } else if (cmp < 0) {
        length = k - 1;
      } else {
        return k;
      }
    }
    return k;
    // return -m - 1;
  }
}
