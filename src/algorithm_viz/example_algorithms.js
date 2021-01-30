function bubbleSort(array) {
  var len = array.length;

  for (var i = 0; i < len; i++) {
    for (var j = 0; j < len - i - 1; j++) {
      if (array.compare(j, j + 1)) {
        array.swap(j, j + 1);
      }
    }
  }
  return array;
}

print(bubbleSort(root));


/**
 * MergeSort
 * @param {*} left
 * @param {*} right
 */
function merge(left, right) {
  var arr = [];

  while (left.length && right.length) {
    if (left[0] < right[0]) {
      arr.push(left.shift());
    } else {
      arr.push(right.shift());
    }
  }
  return arr.concat(left).concat(right);
}

function mergeSort(root) {
  var half = root.length / 2;
  if (root.length < 2) return root;
  var left = root.splice(0, half);
  return merge(mergeSort(left), mergeSort(root));
}
print(mergeSort(root));

/**
 * Insertion Sort
 */
function insertion_Sort(nums) {
  for (var i = 1; i < nums.length; i++) {
    var j = i - 1;
    var temp = nums.get(i);

    while (j >= 0 && nums[j] > temp) {
      var val = nums.get(j);
      nums.set(j + 1, val);
      j--;
    }
    nums.set(j + 1, temp);
  }
  return nums;
}

print(insertion_Sort(root));
