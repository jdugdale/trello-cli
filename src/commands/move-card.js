"use strict";

var __ = function(program, output, logger, config, trello, translator) {
    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
        const card_re = /(?:(?:https?:\/\/)?(?:www\.)?trello\.com\/c\/)?([a-z0-9]+)\/?.*/i;
        const board_re = /(?:(?:https?:\/\/)?(?:www\.)?trello\.com\/b\/)?([a-z0-9]+)\/?.*/i;

        if (options.alias)
            options.list = translator.getListIdByAlias(options.alias);

        var cardId = card_re.test(options.card) ?
            card_re.exec(options.card)[1] :
            null;

        var tmp = translator.getCardIdByShortId(options.card);
        if (tmp) cardId = tmp;

        if (!cardId) {
            console.error(
                "Could not parse card ID, example: https://trello.com/c/<ID> or <ID>"
            );
            return;
        }

        var boardId =
            options.board && board_re.test(options.board) ?
            board_re.exec(options.board)[1] :
            null;

        var pos =
            options.pos ||
            (/^\d+$/.test(options.board) ?
                (function() {
                    boardId = null;
                    return options.board;
                })() :
                null);

        var posFunc = pos ?
            position => {
                trello.put(
                    "/1/cards/" + cardId + "/pos", { value: position },
                    function(err, data) {
                        if (err) {
                            console.error(err, data);
                        } else {
                            console.log("Card moved to position", position);
                        }
                    }
                );
            } :
            null;


        trello.put(
            "/1/cards/" + cardId + "/" + (boardId == null ? "idList" : "idBoard"),
            boardId == null ? { value: options.list } : { value: boardId, idList: options.list },
            function(err, data) {
                if (err) {
                    console.error(err, data);
                } else {
                    console.log("Card moved");
                    if (posFunc) {
                        console.log("Positioning card...");
                        posFunc(pos);
                    }
                }
            }
        );
    };

    trelloApiCommand.nomnomProgramCall = function() {
        program
            .command("move-card")
            .help("Move a card on a board")
            .options({
                card: {
                    position: 1,
                    abbr: "c",
                    metavar: "<card>",
                    help: "The card's name/id/url to move",
                    required: true
                },
                list: {
                    abbr: "l",
                    metavar: "LIST",
                    help: "The list name/id to move the card to",
                    required: false
                },
                board: {
                    abbr: "b",
                    metavar: "BOARD",
                    help: "The board name/id/url to move the card to (if the list is in another board)",
                    required: false
                },
                alias: {
                    abbr: "a",
                    metavar: "ALIAS",
                    help: "Pre-configured alias of the target list. Must supply either this option OR boardName, listName",
                    required: false
                },
                pos: {
                    abbr: "p",
                    metavar: "POS",
                    help: "Position of the new card",
                    required: false
                }
            })
            .callback(function(options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });
    };

    return trelloApiCommand;
};
module.exports = __;