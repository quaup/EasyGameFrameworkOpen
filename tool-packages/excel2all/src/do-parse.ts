export function doParse(
    parseConfig: ITableConvertConfig,
    fileInfos: IFileInfo[],
    parseResultMap: TableParseResultMap,
    parseHandler: ITableParseHandler
) {
    let parseResult;
    for (let i = fileInfos.length - 1; i >= 0; i--) {
        parseResult = parseResultMap[fileInfos[i].filePath];
        if (!parseResult) {
            parseResult = { filePath: fileInfos[i].filePath };
        }
        if (!parseResult.tableObj) {
            parseResult = parseHandler.parseTableFile(parseConfig, fileInfos[i], parseResult);
        }
        if (parseResult) {
            parseResultMap[fileInfos[i].filePath] = parseResult;
        }
    }
}
