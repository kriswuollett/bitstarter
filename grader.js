#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(url) {
    console.log("assertUrlExists(%s)", url);
    var instr;
    rest.get(url).on('complete', function(result) {
	if (result instanceof Error) {
	    console.log("%s retreival had error: %s. Exiting", result.message);
	    process.exit(1);
	}
	instr = result;
        console.log("Got result: %s", result);
    });
    console.log("Returning result: %s", instr);
    return instr;
}

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlString = function(htmlString, checksFile) {
    $ = cheerio.load(htmlString);
    var checks = loadChecks(checksFile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
}


var checkUrl = function(url, checksfile) {
    rest.get(url).on('complete', function(result) {
	if (result instanceof Error) {
	    console.log("%s retreival had error: %s. Exiting", result.message);
	    process.exit(1);
	}
        var checkJson = checkHtmlString(result, checksfile);
	var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    });
    
 }

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Path to URL')
        .parse(process.argv);
    if (typeof program.file === 'undefined' && typeof program.url === 'undefined') {
	console.log("Either -url or -file must be specified. Exiting.");
	process.exit(1);
    }
    if (typeof program.url != 'undefined') {
	checkUrl(program.url, program.checks);
    } else {
	var fileStr = program.file || program.url;
	var checkJson = checkHtmlFile(fileStr, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
