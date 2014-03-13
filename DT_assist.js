// 引用 http 模块
var http = require("http");
// 引用 filestream 模块
var fs = require("fs");
 
//获取合并的入口文件
var objQuery = querystring.parse(url.parse(request.url).query);
var entryFiles = objQuery.entryFiles;
var path = 'D:\\code\\qhee-webapp-dev\\src\\main\\webapp\\resources\\js\\';
var outTmp = ["$"];
var depenArray=[];
var fileObj={};
var _Tool = {
	keys: Object.keys ? Object.keys: function(o) {
		var ret = [];
		for (var p in o) {
			if (o.hasOwnProperty(p)) ret.push(p);
		}
		return ret;
	},
	forEach: Array.prototype.forEach ? function(arr, fn) {
		arr.forEach(fn);
		}: function(arr, fn) {
		for (var i = 0; i < arr.length; i++) fn(arr[i], i, arr);
	},
	unique: function(arr) {
		var o = {};
		_Tool.forEach(arr,function(item){
		o[item] = 1;
		});
		return _Tool.keys(o);
	},
	getUrl:function(name){
		return name+".js";
	},
	getPath:function(name){
		return path+name+".js"; 
	},
	makeFile:function(name){
		return 	path+name+".min.js";	
	},
	unrepeat:function(arr1,arr2){
		console.log(arr2);
		console.log(1)
		if(arr2.length){
			for(var i = 0;i<arr1.length;i++){
				if(~arr2.indexOf(arr1[i])){
					arr1.splice(i,1);
				}
			}
		}
	}				
}
var commentRegExp=/(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
var jsRequireRegExp=/[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g; 
var getDepend=function(str){
		var tempStr = [] ;
		str.replace(commentRegExp, '').replace(jsRequireRegExp, function(match, dep) {
			tempStr.push(dep);
		});
		return _Tool.unique(tempStr); 
}
//获取单个文件内的所有依赖
var getFileDenpens=function(fileName){
	try{
		var datas = fs.readFileSync(_Tool.getPath(fileName),'utf-8');
	}catch(e){
		console.log(e);
	}
	fileObj[fileName]=datas;
	var tempArr = getDepend(datas.toString());
	if(tempArr.length){
		//在依赖去除核心类库
		_Tool.unrepeat(tempArr,outTmp);
		return tempArr;
	}
}
//递归获取所有的依赖文件
var getAllDepen =  function(depenarr){
	var tempArr=[];
	if(depenarr.length){
		depenArray.push(depenarr);
		for(var i = 0;i<depenarr.length;i++){
			var temp = getFileDenpens(depenarr[i]);
			if(temp){
				tempArr = tempArr.concat(temp);					
			}
		}
		if(tempArr.length){
			getAllDepen(tempArr);			
		}
	}
}
//把所有依赖合并写入一个文件
var makeFiles = function(callback){
	fs.open(_Tool.makeFile(entryFiles),"w",callback);
}
var concatFile = function(files,arr){
	if(!arr) return ;
	for(var i = 0;i<arr.length;i++){
		if(fileObj[arr[i]]){
			try{
				if(i==0){
					fs.writeFileSync(files,fileObj[arr[i]].toString()+";\n");
				}else{
					fs.appendFileSync(files,fileObj[arr[i]].toString()+";\n");
				}
			}catch(e){
				console.log(e)	
			}	
		}
	}
	console.log("concat file OK");
}
//paths压缩文件的主寻址路径，跟DT的主寻址路径一样
//entryFiles压缩的入口文件
//outTmps 排除压缩之外的依赖文件（比如jquery等类库）
exports.DT_concat = function(paths,entryFiles,outTmps){
	if(entryFiles){
		if(paths){
			path = paths;
		}
		if(outTmps){
			outTmp = outTmps;
		}
		var tempArr = getFileDenpens(entryFiles);
		if(tempArr){
			getAllDepen(tempArr)
		};
		var resultDepen = ((depenArray.join()).split(",")).reverse();
		//去除重复依赖
		var temp = [];
		for(var i =0;i<resultDepen.length;i++){
			if(temp.indexOf(resultDepen[i])==-1){
				temp.push(resultDepen[i]);
			}
		}
		//加入当前文件
		temp.push(entryFiles);
		console.log("remove Depen File"+outTmp);
		console.log("acquisition Depen File"+temp);
		var files = _Tool.makeFile(entryFiles);
		makeFiles(function(){concatFile(files,temp)});	
	}
}
