#!/bin/bash

function startServer {
    echo "Starting Balls server..."
    (cd server ; nohup node server.js > server.log & echo $! > pid) &>/dev/null
    echo "Started with PID: $(<server/pid)."
}

function stopServer {
    server_pid=$(<server/pid)
    echo "Stopping Balls server on PID: $server_pid..."
    kill -3 $server_pid &>/dev/null
    wait $server_pid &>/dev/null
    rm server/pid &>/dev/null
    echo "Stopped."
}

function restartServer {
    stopServer
    startServer
}

case "$1" in
    start)
        startServer
        ;;
    stop)
        stopServer
        ;;
    restart)
        restartServer
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        ;;
esac
