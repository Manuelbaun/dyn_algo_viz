// prevent rollup to shorten the names!
(window as any)["algoviz"] = {};
(window as any)["algoviz"]["setResult"] = function (result: any) {
  (window as any)["algoviz"]["result"] = result;
};
(window as any)["algoviz"]["getResult"] = function () {
  return (window as any)["algoviz"]["result"];
};
