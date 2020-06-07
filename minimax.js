const INFINITY = 1000000
const MINUS_INFINITY = -INFINITY

const PLAYER1_SQUARE = 'p'
const COMPUTER_SQUARE = 'c'

const initialGameState = [
  [ '' , '', '' , ''], 
  [ '' , '', '' , ''], 
  [ '' , '', '' , ''], 
  [ '' , '', '' , ''], 
]

const getLegalMovesFromSquare = (gameState, x, y) => {
  const square = gameState[y][x]
  if ([PLAYER1_SQUARE, COMPUTER_SQUARE, 'trbl'].includes(square)) {
    return []
  }

  return ['t', 'r', 'b', 'l'].filter(move => !square.includes(move)).map(move => ({ x, y, move }))
}

const getAllValidMoves = (gameState) => {
  return gameState.reduce((allChildren, row, y) => {
    const rowMoves = row.reduce((children, square, x) => {
      return [...children, ...getLegalMovesFromSquare(gameState, x, y)]
    }, [])
    return [...allChildren, ...rowMoves]
  }, [])
}

const generateNewState = (currentState, move, player) => {
  let newState = currentState.map(row => [...row])
  
  newState[move.y][move.x] += move.move

  switch (move.move) {
    case 't':
      if (move.y !== 0) {
        newState[move.y - 1][move.x] += 'b'
      }
      break;
    case 'r':
      if (move.x !== (currentState[move.y].length - 1)) {
        newState[move.y][move.x + 1] += 'l'
      }
      break;
    case 'b':
      if (move.y !== (currentState.length - 1)) {
        newState[move.y + 1][move.x] += 't'
      }
      break;
    case 'l':
      if (move.x !== 0) {
        newState[move.y][move.x - 1] += 'r'
      }
      break;
  }

  let markedSquare = false

  newState = newState.map(row => {
    return row.map(col => {
      if (col.length === 4) {
        markedSquare = true
      }
      return col.length === 4 ? player : col
    })
  })

  return {markedSquare, newState}
}

const calculateSquareScore = (square) => {
  if (square === COMPUTER_SQUARE) {
    return 1
  } else if (square === PLAYER1_SQUARE) {
    return -1
  }
  return 0
}

const scoreGameState = gameState => {
  return gameState.reduce((totalScore, row) => {
    return totalScore + row.reduce((rowScore, square) => {
      return rowScore + calculateSquareScore(square)
    }, 0)
  }, 0)
}

const isLeaf = gameState => {
  return getAllValidMoves(gameState).length === 0
}

const squareIfPossible = (currentState, moves) => moves.filter(move => {
  return currentState[move.y][move.x].length === 3
})

const randomPlayForBigDepth = (currentState, moves, depth) => {
  if (depth > 70) {
    const nonCriticalMoves = moves.filter(move => currentState[move.y][move.x].length < 2)
    return nonCriticalMoves.length > 0 ? [nonCriticalMoves[0]] : []
  }
  return []
}

const bypassHeuristics = (currentState, moves, depth) => {
  if (moves.length === 0) return []
  const sqip = squareIfPossible(currentState, moves)
  if (sqip.length > 0) {
    return sqip 
  }
  return randomPlayForBigDepth(currentState, moves, depth)
}

let cont = 0
let minDepth = 1000

const minimax  = (node, depth, maxPlayer) => {
  cont += 1
  
  if (depth < minDepth) {
    minDepth = depth
  }

  if (depth === 0 || isLeaf(node.currentState)) {
    return scoreGameState(node.currentState)
  }

  let [ initialBestValue, resolverFuncion ] = maxPlayer ? [MINUS_INFINITY, Math.max] : [INFINITY, Math.min]
  let maxPlayerNextCall = !maxPlayer

  return node.moves.reduce((bestValue, move) => {
    const player = maxPlayer ? COMPUTER_SQUARE : PLAYER1_SQUARE
    const {newState, markedSquare} = generateNewState(node.currentState, move, player)

    let moves = getAllValidMoves(newState)
    
    const heuristicsMoves = bypassHeuristics(newState, moves, depth)

    // if (depth === 100) {
    //   console.log(moves)
    //   console.log(heuristicsMoves)
    // }

    if (heuristicsMoves.length > 0) {
      moves = heuristicsMoves
    }

    if (markedSquare) {
      maxPlayerNextCall = maxPlayer
    }

    const value = minimax({currentState: newState, moves}, depth - 1, maxPlayerNextCall)
    return resolverFuncion(bestValue, value)
  }, initialBestValue)
}

export const playWithMinimax = (currentState) => {
  const moves = getAllValidMoves(currentState)
  const movesScores = moves.map(move => {
    const root = {
      currentState,
      moves: [move]
    }
    const score = minimax(root, 100, true)
    return {...move, score}
  })

  console.log('minDepth', minDepth)
  console.log('count', cont)
  cont = 0
  minDepth = 1000

  return movesScores.reduce((bestMove, currentMove) => {
    return bestMove.score > currentMove.score ? bestMove : currentMove
  }, {score: MINUS_INFINITY})
}


// const result = minimax(root, 100, true)
// console.log('cont', cont)
console.log('min Depth', minDepth)
// console.log('result ', result)

const interstingState = [
  ["b", "b", "rb", "l"],
  ["trbl", "trbl", "trbl", "l"],
  ["trbl", "trbl", "trbl", "rl"],
  ["trl", "trl", "tl", ""],
]

const alphabeta  = (node, depth, a, b, maxPlayer) => {
  cont += 1
  
  if (depth < minDepth) {
    minDepth = depth
  }

  if (depth === 0 || isLeaf(node.currentState)) {
    return scoreGameState(node.currentState)
  }

  let pruned = false

  let [ initialBestValue ] = maxPlayer ? [ MINUS_INFINITY ] : [ INFINITY ]
  let maxPlayerNextCall = !maxPlayer

  return node.moves.reduce((bestValue, move) => {
    const player = maxPlayer ? COMPUTER_SQUARE : PLAYER1_SQUARE
    const {newState, markedSquare} = generateNewState(node.currentState, move, player)

    let moves = getAllValidMoves(newState)
    
    const heuristicsMoves = bypassHeuristics(newState, moves, depth)

    if (heuristicsMoves.length > 0) {
      moves = heuristicsMoves
    }

    if (markedSquare) {
      maxPlayerNextCall = maxPlayer
    }

    if (!pruned) {
      if (maxPlayer) {
        a = Math.max(a, alphabeta({currentState: newState, moves}, depth - 1, a, b, maxPlayerNextCall))  
        if (a >= b) {
          pruned = true
        }
        return a
      } else {
        b = Math.min(b, alphabeta({currentState: newState, moves}, depth - 1, a, b, maxPlayerNextCall))  
        if (a >= b) {
          pruned = true
        }
        return b
      }
    }

    return bestValue
  }, initialBestValue)
}



export const playWithAlphabeta = (currentState) => {
  const moves = getAllValidMoves(currentState)
  const movesScores = moves.map(move => {
    const root = {
      currentState,
      moves: [move]
    }
    const score = alphabeta(root, 100, MINUS_INFINITY, INFINITY, true)
    return {...move, score}
  })

  console.log('minDepth', minDepth)
  console.log('count', cont)
  cont = 0
  minDepth = 1000

  return movesScores.reduce((bestMove, currentMove) => {
    return bestMove.score > currentMove.score ? bestMove : currentMove
  }, {score: MINUS_INFINITY})
}



// console.log(playWithMinimax(interstingState))