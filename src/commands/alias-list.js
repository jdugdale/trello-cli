"use strict";

var __ = function(
    program,
    output,
    logger,
    config,
    trello,
    translator,
    trelloApiCommands
) {
    var trelloApiCommand = {};
    trelloApiCommand.createAlias = function(options, onComplete) {
        var boardId, listId;

        // get or create the board
        try {
            boardId = translator.getBoardIdByName(options.boardName);
        } catch (err) {
            if (err.message == "Unknown Board") {
                if (options.force && !options.triedToCreateBoard) {
                    logger.info("Board doesn't exist, creating...");
                    options.triedToCreateBoard = true;
                    trelloApiCommands["add-board"].makeTrelloApiCall(options, function() {
                        trelloApiCommands["add-card"].makeTrelloApiCall(options, null);
                    });
                    return;
                } else {
                    logger.error("Board '" + options.boardName + "' does not exist.  Exiting.");
                    process.exit(1);
                }
            } else {
                logger.error("Unknown error:");
                throw err;
            }
        }

        // get or create the list
        try {
            listId = translator.getListIdByBoardNameAndListName(
                options.boardName,
                options.listName
            );
        } catch (err) {
            if (err.message == "Unknown List") {
                if (options.force && !options.triedToCreateList) {
                    logger.info("List doesn't exist, creating...");
                    options.triedToCreateList = true;
                    trelloApiCommands["add-list"].makeTrelloApiCall(options, function() {
                        // This is hacky; but sometimes the request to refresh seems to happen too quick for Trello's servers, and they don't
                        // return the newly created list.  This mitigates that problem.
                        setTimeout(function() {
                            trelloApiCommands[
                                "refresh"
                            ].makeTrelloApiCall(options, function() {
                                trelloApiCommands["add-card"].makeTrelloApiCall(options, null);
                            });
                        }, 1500);
                    });
                    return;
                } else {
                    logger.error("List '" + options.listName + "' does not exist.  Exiting.");
                    process.exit(1);
                }
            } else {
                logger.error("Unknown error:");
                throw err;
            }
        }

        translator.aliasList(listId, options.alias);
    }; // end of trelloApiCommand.createAlias

    trelloApiCommand.nomnomProgramCall = function() {
        program
            .command("alias-list")
            .help("Create an alias for quick access to list")
            .options({
                alias: {
                    position: 1,
                    help: "The new alias",
                    list: false,
                    required: true
                },
                boardName: {
                    abbr: "b",
                    metavar: "BOARD",
                    help: "The board name of the list to alias",
                    required: true
                },
                listName: {
                    abbr: "l",
                    metavar: "LIST",
                    help: "The list name to alias",
                    required: true
                },
                force: {
                    abbr: "f",
                    help: "Force - will create the board and/or list if they don't already exist",
                    flag: true,
                    required: false
                },
                verbose: {
                    abbr: "v",
                    help: "Turn on increased error reporting",
                    required: false,
                    flag: true
                }
            })
            .callback(function(options) {
                trelloApiCommand.createAlias(options);
            });
    };

    return trelloApiCommand;
};

module.exports = __;