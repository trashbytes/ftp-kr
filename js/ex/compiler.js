
const vscode = require('vscode');
const workspace = vscode.workspace;
const window = vscode.window;

const cfg = require('./config');
const work = require('../work');
const closure = require('../closure');
const util = require('../util');

var latestCompilePath = '';

function getSelectedFilePath()
{
	return window.activeTextEditor.document.fileName.replace(/\\/g, '/');
}
function getSelectedMakeJson()
{
	const filename = getSelectedFilePath();
    return filename.substr(0, filename.lastIndexOf('/')+1) + "make.json";
}
/**
 * @param {string} makejson
 * @param {string} input
 * @param {!Error} err
 */
function generateConfirm(makejson, input, err)
{
	return util.errorConfirm(err, 'Generate make.json')
	.then((select)=>{
		if (!select) return;
		return closure.makeJson(makejson, input);
	});
}

module.exports = {
    load  () {

    },
    unload() {

    },
    commands: {
        'ftpkr.makejson' (){
            if (!window.activeTextEditor) return;
			return closure.makeJson(getSelectedMakeJson(), getSelectedFilePath()).catch(util.error);
        },
        'ftpkr.closureCompile' (){
            return cfg.loadTest()
            .then(() => workspace.saveAll())
            .then(() => work.compile.add(() => {
                    if (!window.activeTextEditor) return;
					const input = getSelectedFilePath();
					const makejson = getSelectedMakeJson();
                    return closure.make(makejson)
					.then(() => { latestCompilePath = makejson; })
					.catch((err)=>{
						if (err.code !== 'ENOENT')
						{
							util.log(err);
							return;
						}
						if (latestCompilePath)
						{
							return closure.make(latestCompilePath)
							.catch((err)=>{
								if (err.code !== 'ENOENT')
								{
									util.log(err);
									return;
								}
								latestCompilePath = '';
								return generateConfirm(makejson, input, err);
							});
						}
						else
						{
							return generateConfirm(makejson, input, err);
						}
					})
                })
            )
			.catch(util.error);
        },
        'ftpkr.closureCompileAll'(){
            return cfg.loadTest()
            .then(() => workspace.saveAll())
            .then(() => work.compile.add(() => closure.all()).catch(util.error))
			.catch(util.error);
        }
    }
};