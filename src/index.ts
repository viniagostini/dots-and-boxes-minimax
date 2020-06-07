// IMPORTANT NOTICE: this isn't my code, i just adapted to run my implementation of minimax and alpha beta pruning
// i got this Dots and Boxes implementation from this youtube video: https://www.youtube.com/watch?v=vAeysIanWTw

"use strict";

import { playWithMinimax, playWithAlphabeta } from './minimax'

// game parameters
const DELAY_COMP = 0.5; // seconds for the computer to take its turn
const DELAY_END = 2; // seconds until a new game starts
const FPS = 30; // frames per second
const GRID_SIZE = 4; // number of rows (and columns)
const HEIGHT = 550; // pixels

// derived dimensions
const WIDTH = HEIGHT * 0.9;
const CELL = WIDTH / (GRID_SIZE + 2); // size of cells (as well as left and right margin)
const STROKE = CELL / 12; // stroke width
const DOT = STROKE; // dot radius
const MARGIN = HEIGHT - (GRID_SIZE + 1) * CELL; // top margin for score, names, etc.

// colours
const COLOR_BOARD = "cornsilk";
const COLOR_BORDER = "wheat";
const COLOR_COMP = "crimson";
const COLOR_COMP_LIT = "lightpink";
const COLOR_DOT = "sienna";
const COLOR_PLAY = "royalblue";
const COLOR_PLAY_LIT = "lightsteelblue";
const COLOR_TIE = "black";

// text
const TEXT_COMP = "Computer";
const TEXT_COMP_SML = "Comp";
const TEXT_PLAY = "Player";
const TEXT_PLAY_SML = "Play";
const TEXT_SIZE_CELL = CELL / 3;
const TEXT_SIZE_TOP = MARGIN / 6;
const TEXT_TIE = "DRAW!";
const TEXT_WIN = "WINS!";

// definitions
const Side = {
    BOT: 0,
    LEFT: 1,
    RIGHT: 2,
    TOP: 3
}

// set up the game canvas
let canv = document.createElement("canvas");
canv.height = HEIGHT;
canv.width = WIDTH;
document.body.appendChild(canv);
let canvRect = canv.getBoundingClientRect();

// set up the context
let ctx = canv.getContext("2d");
ctx.lineWidth = STROKE;
ctx.textAlign = "center";
ctx.textBaseline = "middle";

// game letiables
let currentCells: { row: number; col: number; }[], playersTurn: boolean, squares: string | any[];
let scoreComp: number, scorePlay: number;
let timeComp: number, timeEnd: number;

// start a new game
newGame();

// event handlers
canv.addEventListener("mousemove", highlightGrid);
canv.addEventListener("click", click);

// set up the game loop
setInterval(loop, 1000 / FPS);

function loop() {
    drawBoard();
    drawSquares();
    drawGrid();
    drawScores();
    goComputer();
}

function click(_: MouseEvent) {
    if (!playersTurn || timeEnd > 0) {
        return;
    }
    selectSide();
}

function drawBoard() {
    ctx.fillStyle = COLOR_BOARD;
    ctx.strokeStyle = COLOR_BORDER;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeRect(STROKE / 2, STROKE / 2, WIDTH - STROKE, HEIGHT - STROKE);
}

function drawDot(x: number, y: number) {
    ctx.fillStyle = COLOR_DOT;
    ctx.beginPath();
    ctx.arc(x, y, DOT, 0, Math.PI * 2);
    ctx.fill();
}

function drawGrid() {
    for (let i = 0; i < GRID_SIZE + 1; i++) {
        for (let j = 0; j < GRID_SIZE + 1; j++) {
            drawDot(getGridX(j), getGridY(i));
        }
    }
}

function drawLine(x0: number, y0: number, x1: number, y1: number, color: string | CanvasGradient | CanvasPattern) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function drawScores() {
    let colComp = playersTurn ? COLOR_COMP_LIT : COLOR_COMP;
    let colPlay = playersTurn ? COLOR_PLAY : COLOR_PLAY_LIT;
    drawText(TEXT_PLAY, WIDTH * 0.25, MARGIN * 0.25, colPlay, TEXT_SIZE_TOP);
    drawText(`${scorePlay}`, WIDTH * 0.25, MARGIN * 0.6, colPlay, TEXT_SIZE_TOP * 2);
    drawText(TEXT_COMP, WIDTH * 0.75, MARGIN * 0.25, colComp, TEXT_SIZE_TOP);
    drawText(`${scoreComp}`, WIDTH * 0.75, MARGIN * 0.6, colComp, TEXT_SIZE_TOP * 2);

    // game over text
    if (timeEnd > 0) {
        timeEnd--;

        // handle a tie
        if (scoreComp == scorePlay) {
            drawText(TEXT_TIE, WIDTH * 0.5, MARGIN * 0.6, COLOR_TIE, TEXT_SIZE_TOP);
        } else {
            let playerWins = scorePlay > scoreComp;
            let color = playerWins ? COLOR_PLAY : COLOR_COMP;
            let text = playerWins ? TEXT_PLAY : TEXT_COMP;
            drawText(text, WIDTH * 0.5, MARGIN * 0.5, color, TEXT_SIZE_TOP);
            drawText(TEXT_WIN, WIDTH * 0.5, MARGIN * 0.7, color, TEXT_SIZE_TOP);
        }

        // new game
        if (timeEnd == 0) {
            newGame();
        }
    }
}

function drawSquares() {
    for (let row of squares) {
        for (let square of row) {
            square.drawSides();
            square.drawFill();
        }
    }
}

function drawText(text: string, x: number, y: number, color: string | CanvasGradient | CanvasPattern, size: string | number) {
    ctx.fillStyle = color;
    ctx.font = size + "px dejavu sans mono";
    ctx.fillText(text, x, y);
}

function getColor(player: boolean, light: boolean) {
    if (player) {
        return light ? COLOR_PLAY_LIT : COLOR_PLAY;
    } else {
        return light ? COLOR_COMP_LIT : COLOR_COMP;
    }
}

function getText(player: any, small: boolean) {
    if (player) {
        return small ? TEXT_PLAY_SML : TEXT_PLAY;
    } else {
        return small ? TEXT_COMP_SML : TEXT_COMP;
    }
}

function getGridX(col: number) {
    return CELL * (col + 1);
}

function getGridY(row: number) {
    return MARGIN + CELL * row;
}

function getValidNeighbourSides(row: number, col: number) {
    let sides = [];
    let square = squares[row][col];

    // check left
    if (!square.sideLeft.selected) {
        if (col == 0 || squares[row][col - 1].numSelected < 2) {
            sides.push(Side.LEFT);
        }
    }

    // check right
    if (!square.sideRight.selected) {
        if (col == squares[0].length - 1 || squares[row][col + 1].numSelected < 2) {
            sides.push(Side.RIGHT);
        }
    }

    // check top
    if (!square.sideTop.selected) {
        if (row == 0 || squares[row - 1][col].numSelected < 2) {
            sides.push(Side.TOP);
        }
    }

    // check bottom
    if (!square.sideBot.selected) {
        if (row == squares.length - 1 || squares[row + 1][col].numSelected < 2) {
            sides.push(Side.BOT);
        }
    }

    return sides;
}

function goComputer() {

    if (playersTurn || timeEnd > 0) {
        return;
    }

    // count down till computer makes a selection
    if (timeComp > 0) {
        timeComp--;
        if (timeComp == 0) {
            selectSide();
        }
        return;
    }

    // set up the options array
    let options = [];
    options[0] = [];
    options[1] = [];
    options[2] = [];

    // first priority - select a square that has 3 sides completed
    // next priority - select a square that has 0 or 1 sides completed
    // final priority - select a square that has 2 sides completed
    for (let i = 0; i < squares.length; i++) {
        for (let j = 0; j < squares[0].length; j++) {
            switch (squares[i][j].numSelected) {
                case 3: // first priority
                    // options[0].push({square: squares[i][j], sides: []});
                    break;
                case 0: // second priority
                case 1:
                    let sides = getValidNeighbourSides(i, j);
                    let priority = sides.length > 0 ? 1 : 2;
                    options[priority].push({square: squares[i][j], sides: sides});
                    break;
                case 2: // third priority
                    options[2].push({square: squares[i][j], sides: []});
                    break;
            }
        }
    }

    let convertedBoard = []

    for (let i = 0; i < squares.length; i++) {
        convertedBoard[i] = []
        for (let j = 0; j < squares[0].length; j++) {
            const square = squares[i][j]

            let convertedSquareValue = ''
            if (square.sideTop.selected) {
                convertedSquareValue += 't'
            }
            if (square.sideRight.selected) {
                convertedSquareValue += 'r'
            }
            if (square.sideBot.selected) {
                convertedSquareValue += 'b'
            }
            if (square.sideLeft.selected) {
                convertedSquareValue += 'l'
            }

            if (square.owner !== null) {
                convertedSquareValue = square.owner ? 'p' : 'c'
            }

            convertedBoard[i] = [...convertedBoard[i], convertedSquareValue]
        }
    }

    console.log(convertedBoard)
    const move = playWithMinimax(convertedBoard)
    const sidesMap : Record<string, number> = {
        t: Side.TOP,
        r: Side.RIGHT,
        b: Side.BOT,
        l: Side.LEFT,
    }
    options[0].push({square: squares[move.y][move.x], sides: [sidesMap[move.move]]});
    console.log(move)

    // randomly choose a square in priority order
    let option: any;
    if (options[0].length > 0) {
        option = options[0][Math.floor(Math.random() * options[0].length)];
    } else if (options[1].length > 0) {
        option = options[1][Math.floor(Math.random() * options[1].length)];
    } else if (options[2].length > 0) {
        option = options[2][Math.floor(Math.random() * options[2].length)];
    }

    // randomly choose a valid side
    let side = null;
    if (option!.sides.length > 0) {
        side = option.sides[Math.floor(Math.random() * option.sides.length)];
    }

    // get the square's coordinates
    let coords = option.square.getFreeSideCoords(side);
    highlightSide(coords.x, coords.y);

    // set up delay
    timeComp = Math.ceil(DELAY_COMP * FPS);
}

function highlightGrid(ev: MouseEvent) {
    if (!playersTurn || timeEnd > 0) {
        return;
    }

    // get mouse position relative to the canvas
    let x = ev.clientX - canvRect.left;
    let y = ev.clientY - canvRect.top;

    // highlight the square's side
    highlightSide(x, y);
}

function highlightSide(x: number, y: number) {

    // clear previous highlighting
    for (let row of squares) {
        for (let square of row) {
            square.highlight = null;
        }
    }

    // check each cell
    let rows = squares.length;
    let cols = squares[0].length;
    currentCells = [];
    OUTER: for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (squares[i][j].contains(x, y)) {

                // highlight current
                let side = squares[i][j].highlightSide(x, y);
                if (side != null) {
                    currentCells.push({row: i, col: j});
                }

                // determine neighbour
                let row = i, col = j, highlight, neighbour = true;
                if (side == Side.LEFT && j > 0) {
                    col = j - 1;
                    highlight = Side.RIGHT;
                } else if (side == Side.RIGHT && j < cols - 1) {
                    col = j + 1;
                    highlight = Side.LEFT;
                } else if (side == Side.TOP && i > 0) {
                    row = i - 1;
                    highlight = Side.BOT;
                } else if (side == Side.BOT && i < rows - 1) {
                    row = i + 1;
                    highlight = Side.TOP;
                } else {
                    neighbour = false;
                }

                // highlight neighbour
                if (neighbour) {
                    squares[row][col].highlight = highlight;
                    currentCells.push({row: row, col: col});
                }

                // no need to continue
                break OUTER;
            }
        }
    }
}

function newGame() {
    currentCells = [];
    playersTurn = Math.random() >= 0.5;
    scoreComp = 0;
    scorePlay = 0;
    timeEnd = 0;

    // set up the squares
    squares = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        squares[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            squares[i][j] = new (Square as any)(getGridX(j), getGridY(i), CELL, CELL);
        }
    }
}

function selectSide() {
    if (currentCells == null || currentCells.length == 0) {
        return;
    }

    // select the side(s)
    let filledSquare = false;
    for (let cell of currentCells) {
        if (squares[cell.row][cell.col].selectSide()) {
            filledSquare = true;
        }
    }
    currentCells = [];

    // check for winner
    if (filledSquare) {
        if (scorePlay + scoreComp == GRID_SIZE * GRID_SIZE) {
            // game over
            timeEnd = Math.ceil(DELAY_END * FPS);
        }
    } else {
        // next player's turn
        playersTurn = !playersTurn;
    }
}

// create the Square object constructor
function Square(x: number, y: number, w: number, h: number) {
    this.w = w;
    this.h = h;
    this.bot = y + h;
    this.left = x;
    this.right = x + w;
    this.top = y;
    this.highlight = null;
    this.numSelected = 0;
    this.owner = null;
    this.sideBot = {owner: null, selected: false};
    this.sideLeft = {owner: null, selected: false};
    this.sideRight = {owner: null, selected: false};
    this.sideTop = {owner: null, selected: false};

    this.contains = function(x: number, y: number) {
        return x >= this.left && x < this.right && y >= this.top && y < this.bot;
    }

    this.drawFill = function() {
        if (this.owner == null) {
            return;
        }

        // light background
        ctx.fillStyle = getColor(this.owner, true);
        ctx.fillRect(
            this.left + STROKE, this.top + STROKE,
            this.w - STROKE * 2, this.h - STROKE * 2
        );

        // owner text
        drawText(
            getText(this.owner, true),
            this.left + this.w / 2,
            this.top + this.h / 2,
            getColor(this.owner, false),
            TEXT_SIZE_CELL
        );
    }

    this.drawSide = function(side: any, color: string | CanvasGradient | CanvasPattern) {
        switch(side) {
            case Side.BOT:
                drawLine(this.left, this.bot, this.right, this.bot, color);
                break;
            case Side.LEFT:
                drawLine(this.left, this.top, this.left, this.bot, color);
                break;
            case Side.RIGHT:
                drawLine(this.right, this.top, this.right, this.bot, color);
                break;
            case Side.TOP:
                drawLine(this.left, this.top, this.right, this.top, color);
                break;
        }
    }

    this.drawSides = function() {

        // highlighting
        if (this.highlight != null) {
            this.drawSide(this.highlight, getColor(playersTurn, true));
        }

        // selected sides
        if (this.sideBot.selected) {
            this.drawSide(Side.BOT, getColor(this.sideBot.owner, false));
        }
        if (this.sideLeft.selected) {
            this.drawSide(Side.LEFT, getColor(this.sideLeft.owner, false));
        }
        if (this.sideRight.selected) {
            this.drawSide(Side.RIGHT, getColor(this.sideRight.owner, false));
        }
        if (this.sideTop.selected) {
            this.drawSide(Side.TOP, getColor(this.sideTop.owner, false));
        }
    }
    
    // return a random free side's coordinates
    this.getFreeSideCoords = function(side: any) {
        
        // valid coordinates of each side
        let coordsBot = {x: this.left + this.w / 2, y: this.bot - 1};
        let coordsLeft = {x: this.left, y: this.top + this.h / 2};
        let coordsRight = {x: this.right - 1, y: this.top + this.h / 2};
        let coordsTop = {x: this.left + this.w / 2, y: this.top};

        // get coordinates of given side
        let coords = null;
        switch (side) {
            case Side.BOT:
                coords = coordsBot;
                break;
            case Side.LEFT:
                coords = coordsLeft;
                break;
            case Side.RIGHT:
                coords = coordsRight;
                break;
            case Side.TOP:
                coords = coordsTop;
                break;
        }

        // return requested side's coordinates
        if (coords != null) {
            return coords;
        }

        // otherwise choose a random free side
        let freeCoords = [];
        if (!this.sideBot.selected) {
            freeCoords.push(coordsBot);
        }
        if (!this.sideLeft.selected) {
            freeCoords.push(coordsLeft);
        }
        if (!this.sideRight.selected) {
            freeCoords.push(coordsRight);
        }
        if (!this.sideTop.selected) {
            freeCoords.push(coordsTop);
        }
        return freeCoords[Math.floor(Math.random() * freeCoords.length)];
    }

    this.highlightSide = function(x: number, y: number) {

        // calculate the distances to each side
        let dBot = this.bot - y;
        let dLeft = x - this.left;
        let dRight = this.right - x;
        let dTop = y - this.top;

        // determine closest value
        let dClosest = Math.min(dBot, dLeft, dRight, dTop);

        // highlight the closest if not already selected
        if (dClosest == dBot && !this.sideBot.selected) {
            this.highlight = Side.BOT;
        } else if (dClosest == dLeft && !this.sideLeft.selected) {
            this.highlight = Side.LEFT;
        } else if (dClosest == dRight && !this.sideRight.selected) {
            this.highlight = Side.RIGHT;
        } else if (dClosest == dTop && !this.sideTop.selected) {
            this.highlight = Side.TOP;
        }

        // return the highlighted side
        return this.highlight;
    }

    this.selectSide = function() {
        if (this.highlight == null) {
            return;
        }

        // select the highlighted side
        switch (this.highlight) {
            case Side.BOT:
                this.sideBot.owner = playersTurn;
                this.sideBot.selected = true;
                break;
            case Side.LEFT:
                this.sideLeft.owner = playersTurn;
                this.sideLeft.selected = true;
                break;
            case Side.RIGHT:
                this.sideRight.owner = playersTurn;
                this.sideRight.selected = true;
                break;
            case Side.TOP:
                this.sideTop.owner = playersTurn;
                this.sideTop.selected = true;
                break;
        }
        this.highlight = null;

        // increase the number of selected
        this.numSelected++;
        if (this.numSelected == 4) {
            this.owner = playersTurn;

            // increment score
            if (playersTurn) {
                scorePlay++;
            } else {
                scoreComp++;
            }

            // filled
            return true;
        }

        // not filled
        return false;
    }
}