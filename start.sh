trap ctrl_c INT
function ctrl_c() {
    echo "go away by default"

    kill $SERVER
    kill $BROWSER

    exit 0
}

PIN=27
LED=11
python3 -u -m http.server --directory Dependent & SERVER=$!
sleep 10s

export DISPLAY=:0
chromium \
	--kiosk --start-fullscreen --incognito --noerrdialogs \
	--disable-translate --no-first-run --disable-infobars \
	--window-position=0,0 --window-size=1280,750 http://127.0.0.1:8000 & BROWSER=$!

raspi-gpio set $PIN ip
raspi-gpio set $LED op

if [[ ! -d /sys/class/gpio/gpio$PIN ]]; then
    echo $PIN >/sys/class/gpio/export
fi

function check {
	COUNT=0
	for N in {1..20}; do
		if [[ $(cat /sys/class/gpio/gpio$PIN/value) == "0" ]]; then
			COUNT=$((COUNT+1))
		fi
		sleep 0.01s
	done
	echo $COUNT
	if [[ "$COUNT" -gt "9" ]]; then
		TEST=1
	else
		TEST=0
	fi
}

export COUNT=0
while true; do
	echo "wait"

	TEST=0
	while [[ "$TEST" -eq "0" ]]; do
		check
	done

	echo "bang!"
	raspi-gpio set $LED dh
	xdotool key F3
	omxplayer Dependent/ha.mp3 -o hdmi

	TEST=1
	while [[ "$TEST" -eq "1" ]]; do
		check
	done

	sleep 2s
	raspi-gpio set $LED dl
done
