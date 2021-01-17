function mergeSome(left, right) {
  var arr = [];

  while (left.length && right.length) {
    if (left[0] < right[0]) {
      arr.push(left.shift());
    } else {
      arr.push(right.shift());
    }
  }

  // var a = merge(arr, left);
  // return merge(a, right);
  return arr.concat(left).concat(right);
}

function mergeSort(root) {
  var half = root.length / 2;
  if (root.length < 2) return root;
  var left = root.splice(0, half);
  return mergeSome(mergeSort(left), mergeSort(root));
}
const result = mergeSort([240, 72, 108, 6, 38, 138, 295, 9, 120, 52]);
constole.log(result);

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

// var test = [];

// var hh = root.shift();
// //root.push(hh);
// test.push(hh);
// print(hh);

// function run(){
// 	var l = root.splice(0, 5);
// 	var l2 = l.splice(0, 2);
// 	var l3 = l.splice(0, 3);
// 	var r2 = root.splice(0, 2);
// 	var r3 = root.splice(0, 3);

// 	bubbleSort(l2);
// 	bubbleSort(l3);
// 	bubbleSort(r2);
// 	bubbleSort(r3);

// 	var m1 = merge(r2, r3);
// 	var m2 = merge(l2, l3);
// 	var m3 = merge(m1, m2);
// }

function mergeSome(left, right) {
  var arr = [];

  while (left.length && right.length) {
    if (left[0] < right[0]) {
      arr.push(left.shift());
    } else {
      arr.push(right.shift());
    }
  }
  print(arr);
  return arr.concat(left).concat(right);
}

function mergeSort(root) {
  var half = root.length / 2;
  if (root.length < 2) return root;
  var left = root.splice(0, half);

  return mergeSome(mergeSort(left), mergeSort(root));
}

const insertion_Sort = (nums) => {
  for (let i = 1; i < nums.length; i++) {
    let j = i - 1;
    let temp = nums[i];
    while (j >= 0 && nums[j] > temp) {
      nums[j + 1] = nums[j];
      j--;
    }
    nums[j + 1] = temp;
  }
  return nums;
};
