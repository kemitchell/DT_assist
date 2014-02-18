
var http = require("http");
var fs = require("fs");

var depenArray = [];
var fileObj = {};
var _Tool = {
	keys: Object.keys ? Object.keys : function(o) {
		var ret = [];
		for (var p in o) {
			if (o.hasOwnProperty(p)) ret.push(p);
		}
		return ret;
	},
	forEach: Array.prototype.forEach ? function(arr, fn) {
		arr.forEach(fn);
	} : function(arr, fn) {
		for (var i = 0; i < arr.length; i++) fn(arr[i], i, arr);
	},
	unique: function(arr) {
		var o = {};
		_Tool.forEach(arr, function(item) {
			o[item] = 1;
		});
		return _Tool.keys(o);
	},
	getUrl: function(name) {
		return name + ".js";
	},
	makeFile: function(name) {
		return name + ".min.js";
	}
}
var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
var jsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
var getDepend = function(str) {
	var tempStr = [];
	str.replace(commentRegExp, '').replace(jsRequireRegExp, function(match, dep) {
		tempStr.push(dep);
	});
	return _Tool.unique(tempStr);
}

//获取单个文件内的所有依赖
var getFileDenpens = function(fileName) {
	try {
		var datas = fs.readFileSync(_Tool.getUrl(fileName), 'utf-8');
	} catch (e) {
		console.log(e);
	}
	fileObj[fileName] = datas;
	var tempArr = getDepend(datas.toString());
	if (tempArr.length) {
		return tempArr;
	}
}
//递归获取所有的依赖文件
var getAllDepen = function(depenarr) {
	var tempArr = [];
	if (depenarr.length) {
		depenArray.push(depenarr);
		for (var i = 0; i < depenarr.length; i++) {
			var temp = getFileDenpens(depenarr[i]);
			if (temp) {
				tempArr = tempArr.concat(temp);
			}
		}
		if (tempArr.length) {
			getAllDepen(tempArr);
		}
	}
}

//把所有依赖合并写入一个文件

var makeFiles = function(fils,callback) {
	fs.open(fils, "w", callback);
}
var concatFile = function(files, arr) {
	if (!arr) return;
	for (var i = 0; i < arr.length; i++) {
		if (fileObj[arr[i]]) {
			try {
				if (i == 0) {
					fs.writeFileSync(files, fileObj[arr[i]].toString());
				} else {
					fs.appendFileSync(files, fileObj[arr[i]].toString());
				}
			} catch (e) {
				console.log(e)
			}
		}
	}
	console.log("concat file OK");
}

exports.getAllDenpens = function() {
	var tempArr = getFileDenpens(entryFiles);
	if (tempArr) {
		getAllDepen(tempArr);
	};
	var resultDepen = ((depenArray.join()).split(",")).reverse();
	//去除重复依赖
	var temp = [];
	for (var i = 0; i < resultDepen.length; i++) {
		if (temp.indexOf(resultDepen[i]) == -1) {
			temp.push(resultDepen[i]);
		}
	}
	return temp;
}
exports.concatAllDenpens=function(paths,temps){
	makeFiles(function() {
		concatFile(paths, temps)
	});
}
//find depens and concat depensFiles
exports.fdc=function(fileName){
	if (fileName) {
		var tempArr = getFileDenpens(fileName);
		if (tempArr) {
			getAllDepen(tempArr)
		};
		var resultDepen = ((depenArray.join()).split(",")).reverse();
		//去除重复依赖
		var temp = [];
		for (var i = 0; i < resultDepen.length; i++) {
			if (temp.indexOf(resultDepen[i]) == -1) {
				temp.push(resultDepen[i]);
			}
		}
		console.log("findDepenFile " + temp);
		var files = _Tool.makeFile(fileName);
		makeFiles(files,function() {
			concatFile(files, temp)
		});
	}
}
