
import { useState, useEffect, useRef } from 'react';
import './index.css';

function App() {
    const [currentLevel, setCurrentLevel] = useState(1);
    const [highestLevel, setHighestLevel] = useState(1);
    const [SIZE, setSIZE] = useState(3);
    const [imageUrl, setImageUrl] = useState('');

    const [tiles, setTiles] = useState([]);
    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isWon, setIsWon] = useState(false);
    const [selectedTileIndex, setSelectedTileIndex] = useState(-1);

    // New UI states
    const [showLevels, setShowLevels] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings states
    const [showGridLines, setShowGridLines] = useState(true);

    const timerRef = useRef(null);

    useEffect(() => {
        // Load highest level from local storage if available
        const savedHighest = localStorage.getItem('puzzleHighestLevel');
        if (savedHighest) {
            setHighestLevel(parseInt(savedHighest, 10));
        }
        initLevel(1);
        return () => stopTimer();
    }, []);

    const initLevel = (level) => {
        stopTimer();
        const newSize = 2 + level;

        // reset states
        setCurrentLevel(level);
        setSIZE(newSize);
        setImageUrl(`https://picsum.photos/id/${10 + level * 5}/600/600`);
        setMoves(0);
        setSeconds(0);
        setIsPlaying(false);
        setIsWon(false);
        setSelectedTileIndex(-1);
        setShowLevels(false);

        // generate tiles
        let newTiles = [];
        for (let i = 0; i < newSize * newSize; i++) {
            newTiles.push({
                correctPos: i,
                currentPos: i,
            });
        }

        // shuffle
        for (let i = newTiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tempPos = newTiles[i].currentPos;
            newTiles[i].currentPos = newTiles[j].currentPos;
            newTiles[j].currentPos = tempPos;
        }

        setTiles(newTiles);
    };

    const startTimer = () => {
        setIsPlaying(true);
        timerRef.current = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const checkWin = (tArray) => {
        const won = tArray.every(t => t.currentPos === t.correctPos);
        if (won) {
            setIsWon(true);
            stopTimer();

            // Update highest level unlock
            if (currentLevel >= highestLevel) {
                const newHighest = currentLevel + 1;
                setHighestLevel(newHighest);
                localStorage.setItem('puzzleHighestLevel', newHighest);
            }
        }
    };

    const handleTileClick = (correctPosIndex) => {
        if (isWon) return;

        const targetTile = tiles.find(t => t.correctPos === correctPosIndex);
        if (targetTile.currentPos === targetTile.correctPos) return;

        if (!isPlaying) {
            startTimer();
        }

        if (selectedTileIndex === -1) {
            setSelectedTileIndex(correctPosIndex);
        } else {
            if (selectedTileIndex === correctPosIndex) {
                setSelectedTileIndex(-1);
                return;
            }

            // Swap the two selected tiles
            const newTiles = [...tiles];
            const tile1 = newTiles.find(t => t.correctPos === selectedTileIndex);
            const tile2 = newTiles.find(t => t.correctPos === correctPosIndex);

            const tempPos = tile1.currentPos;
            tile1.currentPos = tile2.currentPos;
            tile2.currentPos = tempPos;

            setSelectedTileIndex(-1);
            setMoves(m => m + 1);
            setTiles(newTiles);
            checkWin(newTiles);
        }
    };

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="app-container">
            {/* Navigation Menu Bar */}
            <nav className="navbar">
                <div className="navbar-logo">🧩 SwapPuzzle</div>
                <div className="navbar-links">
                    <button className="nav-btn" onClick={() => setShowLevels(true)}>Levels</button>
                    <button className="nav-btn" onClick={() => setShowSettings(true)}>Settings</button>
                </div>
            </nav>

            <div className="game-container">
                <h2 className="level-title">Level {currentLevel} ({SIZE}x{SIZE})</h2>

                <div className="stats">
                    <span>Moves: <span>{moves}</span></span>
                    <span>Time: <span>{formatTime(seconds)}</span></span>
                </div>

                <div className="board">
                    {tiles.map(tile => {
                        const row = Math.floor(tile.currentPos / SIZE);
                        const col = tile.currentPos % SIZE;
                        const correctRow = Math.floor(tile.correctPos / SIZE);
                        const correctCol = tile.correctPos % SIZE;

                        const isLocked = tile.currentPos === tile.correctPos;
                        const isSelected = tile.correctPos === selectedTileIndex;

                        const style = {
                            width: `${(100 / SIZE).toFixed(4)}%`,
                            height: `${(100 / SIZE).toFixed(4)}%`,
                            backgroundImage: `url('${imageUrl}')`,
                            backgroundSize: `${SIZE * 100}% ${SIZE * 100}%`,
                            backgroundPosition: `-${correctCol * 100}% -${correctRow * 100}%`,
                            left: `${(col / SIZE * 100).toFixed(4)}%`,
                            top: `${(row / SIZE * 100).toFixed(4)}%`,
                        };

                        if (isLocked) {
                            style.border = 'none';
                            style.zIndex = '5';
                            style.cursor = 'default';
                        } else if (isSelected) {
                            style.border = '4px solid #FFD700';
                            style.zIndex = '20';
                            style.cursor = 'pointer';
                        } else {
                            style.border = showGridLines ? '1px solid rgba(255, 255, 255, 0.4)' : 'none';
                            style.zIndex = '1';
                            style.cursor = 'pointer';
                        }

                        return (
                            <div
                                key={tile.correctPos}
                                className="tile"
                                style={style}
                                onClick={() => handleTileClick(tile.correctPos)}
                            />
                        );
                    })}
                </div>

                <div className="controls">
                    <button className="action-btn" onClick={() => initLevel(currentLevel)}>Restart Level</button>
                </div>
            </div>

            {/* Level Selection Modal */}
            {showLevels && (
                <div className="modal">
                    <div className="modal-content level-modal">
                        <div className="modal-header">
                            <h2>Select Level</h2>
                            <button className="close-btn" onClick={() => setShowLevels(false)}>&times;</button>
                        </div>
                        <div className="level-grid">
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(level => (
                                <button
                                    key={level}
                                    className={`level-btn ${level <= highestLevel ? 'unlocked' : 'locked'} ${level === currentLevel ? 'current' : ''}`}
                                    onClick={() => {
                                        if (level <= highestLevel) initLevel(level);
                                    }}
                                    disabled={level > highestLevel}
                                >
                                    {level > highestLevel ? '🔒' : level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="modal">
                    <div className="modal-content settings-modal">
                        <div className="modal-header">
                            <h2>Settings</h2>
                            <button className="close-btn" onClick={() => setShowSettings(false)}>&times;</button>
                        </div>
                        <div className="settings-body">
                            <div className="setting-item">
                                <label>Show Grid Lines</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={showGridLines}
                                        onChange={(e) => setShowGridLines(e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div className="setting-help">
                                <p>Toggle grid lines to make the puzzle harder by hiding the cut borders between loose pieces!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Win Modal */}
            {isWon && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Level Cleared!</h2>
                        <p>Solved in <span>{moves}</span> moves and <span>{formatTime(seconds)}</span>.</p>
                        <div style={{ marginTop: '25px' }}>
                            <button className="action-btn" onClick={() => initLevel(currentLevel)}>Replay</button>
                            <button className="action-btn btn-success" onClick={() => initLevel(currentLevel + 1)}>Next Level</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
Pressing key...Getting DOM...Stopping...

Stop Agent
