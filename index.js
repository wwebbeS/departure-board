(function ($) {
    var blurCount = 0;

    var DepartureLine = function ($ele, options) {
        var _this = this;
        this.id = Math.floor(Math.random() * 1000) + 1;
        this.$ele = $ele;
        this.options = $.extend({}, this.defaults, options);

        // is transform loaded?
        this.options.transform = this.options.transform && $.transform;

        this.$div = $('<div></div>');
        this.$div.attr('class', 'departure-line ' + this.$ele.attr('class'));
        this.$ele.hide().after(this.$div);

        this.$ele.bind('change.departure-line', function () {
            _this.update();
        });

        this.init();
    }

    DepartureLine.prototype = {
        defaults: {
            width: 100,
            format: null,
            align: 'right',
            padding: ' ',
            chars: null,
            chars_preset: 'num',
            timing: 200,
            min_timing: 10,
            threshhold: 100,
            transform: true,
            on_anim_start: null,
            on_anim_end: null,
            cycleInterval: null,
        },

        init: function () {
            var _this = this;
            this.digits = [];

            for (i = 0; i < this.options.width; i++) {
                this.digits[i] = new DepartureDigit(null, this.options);
                this.$div.append(this.digits[i].$ele);
            }

            this.$div.on('digitAnimEnd', function (e) {
                _this.onDigitAnimEnd(e);
            });

            if (this.options.on_anim_start) {
                this.$div.on('animStart', this.options.on_anim_start);
            }

            if (this.options.on_anim_end) {
                this.$div.on('animEnd', this.options.on_anim_end);
            }

            this.update();

            if (this.options.cycleInterval) {
                this.startCycle();
            }
        },

        update: function () {
            var value = this.$ele.val().replace(/[\s|\u00a0]/g, ' ');

            if (value) {
                this.$div.addClass('filled');
            } else {
                this.$div.removeClass('filled');
            }

            var digits = this.getDigits(value);
            this.digitsFinished = 0;

            this.$div.trigger('animStart');

            for (var i = 0; i < this.digits.length; i++) {
                this.digits[i].goToChar(digits[i]);
            }
        },

        onDigitAnimEnd: function (e) {
            this.digitsFinished++;

            if (this.digitsFinished == this.options.width) {
                this.$div.trigger('animEnd');
            }
        },

        getDigits: function (val, length) {
            var strval = val + '';

            if (this.options.format) {
                strval = $.formatNumber(val, this.options.format);
            }

            var digits = strval.split('');

            if (digits.length < this.options.width) {
                while (digits.length < this.options.width) {
                    if (this.options.align == 'left') {
                        digits.push(this.options.padding);
                    } else {
                        digits.unshift(this.options.padding);
                    }
                }
            } else if (digits.length > this.options.width) {
                var overage = digits.length - this.options.width;
                if (this.options.align == 'left') {
                    digits.splice(-1, overage);
                } else {
                    digits.splice(0, overage);
                }
            }

            return digits;
        },

        startCycle: function () {
            var self = this;
            setInterval(function () {
                for (var i = 0; i < self.digits.length; i++) {
                    self.digits[i].goToNextPosition();
                }
            }, this.options.cycleInterval);
        },

    }

    DepartureDigit = function ($ele, opts) {
        this.options = opts;

        if (!this.options.chars) {
            this.options.chars = this.presets[this.options.chars_preset];
        }

        this.pos = 0;
        this.timeout;

        if (!$ele) {
            this.$ele = $(this.htmlTemplate);
        } else {
            this.$ele = $ele;
        }

        this.$prev = this.$ele.find('.front.top, .back.bottom');
        this.$next = this.$ele.find('.back.top, .front.bottom');
        this.$back_top = this.$ele.find('.back.top');
        this.$back_bottom = this.$ele.find('.back.bottom');
        this.$front_top = this.$ele.find('.front.top');
        this.$front_bottom = this.$ele.find('.front.bottom');

        this.initialize();
    }

    DepartureDigit.prototype = {

        presets: {
            date: [' ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            time: [' ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            alpha: [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
            alphaNum: [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        },

        initialize: function () {
            this.$prev.html(this.options.chars[0]);
            this.$next.html(this.options.chars[0]);
        },

        htmlTemplate: '<div class="digit"><div class="back top">&nbsp;</div>' +
            '<div class="back bottom">&nbsp;</div>' +
            '<div class="front top">&nbsp;</div>' +
            '<div class="front bottom">&nbsp;</div></div>',

        increment: function (speed) {
            var next = this.pos + 1;
            if (next >= this.options.chars.length) {
                next = 0;
            }

            this.$prev.html(this.options.chars[this.pos]).show();

            this.$front_bottom.hide();
            this.$next.html(this.options.chars[next]);

            var speed1 = Math.floor(Math.random() * speed * .4 + speed * .3);
            var speed2 = Math.floor(Math.random() * speed * .1 + speed * .2);

            if (speed >= this.options.threshhold) {
                if (($(document.body).width() > 480) && this.options.transform) {
                    this.animateSlow(speed1, speed2);
                } else {
                    this.animateFast(speed1, speed2);
                }
            }

            this.pos = next;
        },

        animateSlow: function (speed1, speed2) {
            var _this = this;
            var $front_top = this.$front_top;
            var $front_bottom = this.$front_bottom;
            var fast = (speed1 + speed2) < 100;
            var blur = fast ? 'blur(2px)' : 'blur(0.5px)';

            this.$back_top.show();
            this.$back_bottom
                .css({
                    filter: blur,
                });
            $front_bottom.transform({
                scaleY: 0.0
            });
            $front_top
                .css({
                    filter: blur,
                    transition: 'scaleY ' + speed1 + 'ms linear',
                })
                .transform({scaleY: 1.0})
                .stop().show()
                .animate({scaleY: 0.0}, speed1, 'swing', function () {
                    _this.$front_bottom
                        .css({
                            filter: blur,
                        })
                        .stop().show()
                        .animate({scaleY: 1.0}, speed2, 'linear', function () {
                            _this.$front_bottom
                                .css({
                                    filter: 'none'
                                });
                            _this.$back_bottom
                                .css({
                                    filter: 'none'
                                });
                        });
                    _this.$front_top.hide().transform({scaleY: 1.0});
                });
        },

        animateFast: function (speed1, speed2) {
            var _this = this;

            if (this.timeout) {
                clearTimeout(this.timeout);
            }

            this.timeout = setTimeout(function () {
                _this.$front_top.hide();

                _this.timeout = setTimeout(function () {
                    _this.$front_bottom.show();

                }, speed2);
            }, speed1);
        },

        goToPosition: function (pos) {
            var _this = this;

            var frameFunc = function () {
                if (_this.timing_timer) {
                    clearInterval(_this.timing_timer);
                    _this.timing_timer = null;
                }

                var distance = pos - _this.pos;
                if (distance < 0) {
                    distance += _this.options.chars.length;
                }

                if (_this.pos == pos) {
                    clearInterval(_this.timing_timer);
                    _this.timing_timer = null;
                    _this.$ele.trigger("digitAnimEnd");
                } else {
                    var duration = Math.floor(
                        (_this.options.timing - _this.options.min_timing)
                        / distance + _this.options.min_timing
                    );
                    _this.increment(duration);
                    _this.timing_timer = setTimeout(frameFunc, duration);
                }

            }

            frameFunc();
        },

        goToNextPosition: function () {
            var next = this.pos + 1;
            if (next >= this.options.chars.length) {
                next = 0;
            }

            this.goToPosition(next);
        },

        goToChar: function (c) {
            var pos = $.inArray(c, this.options.chars);

            if (pos === -1) {
                this.options.chars.push(c);
                pos = this.options.chars.length - 1;
            }

            this.goToPosition(pos);
        }
    };

    $.fn.departure = function (options) {
        this.each(function () {
            new DepartureLine($(this), options);
        });

        return this;
    }

})(jQuery);

var DepartureBuffer = function (wrap, num_lines) {
    this.wrap = wrap;
    this.num_lines = num_lines;
    this.line_buffer = '';
    this.buffers = [[]];
    this.cursor = 0;
};

DepartureBuffer.prototype = {

    pushLine: function (line) {

        if (this.buffers[this.cursor].length < this.num_lines) {
            this.buffers[this.cursor].push(line);
        } else {
            this.buffers.push([]);
            this.cursor++;
            this.pushLine(line);
        }
    },

    pushWord: function (word) {
        if (this.line_buffer.length == 0) {
            this.line_buffer = word;
        } else if ((word.length + this.line_buffer.length + 1) <= this.wrap) {
            this.line_buffer += ' ' + word;
        } else {
            this.pushLine(this.line_buffer);
            this.line_buffer = word;
        }
    },

    flush: function () {
        if (this.line_buffer.length) {
            this.pushLine(this.line_buffer);
            this.line_buffer = '';
        }
    },

};

$(document).ready(function () {
    /*var isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
        .test(navigator.userAgent.toLowerCase());*/

    var isPhone = window.orientation > -1;
    var isPortraitPhone = false;

    var timers = [];
    var lineDelay = 300;
    var screenDelay = 7000;

    var namesColCount = 10;
    var rowCount = 1;
    var max = 1;

    var $window = $(window);

    var $template = $('#template');
    var $templateRow = $('.row:first', $template);

    var $displays = $('#displays');

    var headers;
    var lastValues = [];
    var values;
    var filteredValues;
    var differences;

    var started = false;
    var displayTimeout;

    detect();
    setup();

    loadData();

    $window.resize(function () {
        var previous = isPortraitPhone;

        detect();

        if ((previous !== isPortraitPhone) || !isPortraitPhone) {
            setup();
        }
    });

    $(document.body).on('touchmove', function () {
        detect();

        var displays = $displays[0];

        if (isPortraitPhone) {
            if ($displays.scrollTop() + displays.clientHeight * 2 > displays.scrollHeight) {
                max = Math.min(
                    max + rowCount,
                    values.length
                );

                displayData();
            }
        }
    });

    function detect() {
        isPortraitPhone = $(document.body).width() < 481;
    }

    function setup() {
        var firstNames = [];
        var lastNames = isPortraitPhone ? firstNames : [];
        var dates = [];
        var times = isPortraitPhone ? dates : [];

        var height = $(document.body).height()
            - (isPortraitPhone ? 20 : 40)
            - $('.head', $displays).height() - 10;

        if (isPortraitPhone) {
            rowCount = Math.min(
                Math.round(
                    height / $template.height()
                ) * 2,
                20
            );

            max = rowCount;
        } else {
            var lineHeight = $templateRow.height();
            var lineSpacing = $templateRow.parent().height() - lineHeight * 2;
            rowCount = Math.floor(
                (height + lineSpacing) / (lineHeight + lineSpacing)
            );

            max = rowCount * 4;
        }

        for (var rowIndex = 0;
             rowIndex < rowCount;
             rowIndex++) {
            firstNames.push(field('first-name'));
            lastNames.push(field('last-name', true));

            dates.push(field('date', true, true));
            times.push(field('time', true, true));
        }

        if (isPortraitPhone) {
            $displays.html(
                [
                    /*column('names', firstNames),
                    column('dateTimes', dates),*/

                    column('names', []),
                    column('dateTimes', []),
                ].join('')
            );
        } else {
            $displays.html(
                [
                    column('firstNames', firstNames),
                    column('lastNames', lastNames),
                    column('dates', dates),
                    column('times', times),
                ].join('')
            );
        }

        lines($('.first-name', $displays), namesColCount, 'alpha');
        lines($('.last-name', $displays), namesColCount, 'alpha');
        lines($('.date', $displays), 6, 'date');
        lines($('.time', $displays), 4, 'time');

        displayData();

        function column(
            id,
            content
        ) {
            return '<div id="' + id + '">' +
                '   <div class="head">&nbsp;</div>' +
                '   <div class="body">' + content.join('') + '</div>' +
                '</div>';
        }

        function field(
            className,
            isFake,
            isNone
        ) {
            var classes = [
                'activity',
                isFake ? 'fake' : '',
                (isNone && isPortraitPhone) ? 'none' : ''
            ].filter(function (_) {
                return _;
            }).join(' ');

            return [
                '<div class="row">',
                (!isPortraitPhone ? '<div class="' + classes + '"></div>' : ''),
                '<input class="' + className + '" />',
                '</div>'
            ].join('');
        }

        function lines(
            $inputs,
            width,
            preset,
        ) {
            $inputs
                .departure({
                    chars_preset: preset,
                    align: 'left',
                    width: width,
                    on_anim_start: function (e) {
                        var $display = $(e.target);
                        $display.prevUntil('.departure-line', '.activity').addClass('active');
                    },
                    on_anim_end: function (e) {
                        var $display = $(e.target);
                        $display.prevUntil('.departure-line', '.activity').removeClass('active');
                    }
                });
        }
    }

    function filterValues() {
        var now = new Date();

        now.setDate(now.getDate() - 2);

        var taken = 0;
        filteredValues = [];

        for (let i = 0,
                 length = values.length;
             ((taken < max) && (i < length));
             i++) {
            const value = values[i];
            if (value[4] > now) {
                filteredValues.push(value);
                taken++;
            }
        }
    }

    function loadData() {
        $.getJSON(
            'https://sheets.googleapis.com/v4/spreadsheets/1lqMFzyih5EJOVpnWsSFVlqoqRcyl7SPeqvXGBWqIoG4/values/A:D?key=AIzaSyD_CmAE2AwO2kld8mHdGuMYFBn2BC6Z4qo',
            function (data) {
                values = data.values;

                headers = values.shift();

                values.forEach(function (value) {
                    var date = value[2].split('/').map(function (_) {
                        return parseInt(_);
                    });
                    var time = value[3].split(':').map(function (_) {
                        return parseInt(_);
                    });

                    var dateTime = new Date(
                        date[2], date[1] - 1, date[0],
                        time[0], time[1]
                    );

                    return value[4] = dateTime;
                });

                values.sort(function (a, b) {
                    return a[4] < b[4] ? -1 : 1;
                });

                filterValues();

                differences = [];

                for (var i = 0,
                         length = filteredValues.length;
                     i < length;
                     i++) {
                    if (lastValues[i]) {
                        var lastValue = JSON.stringify(lastValues[i]);
                        var newValue = JSON.stringify(filteredValues[i]);

                        if (lastValue !== newValue) {
                            differences.push(i);
                        }
                    }
                }

                lastValues = filteredValues;

                if (!started) {
                    started = true;

                    displayData();
                }
            });

        setTimeout(loadData, 10 * 1000);
    }

    function displayData() {
        clearTimeout(displayTimeout);

        if (headers) {
            if (isPortraitPhone) {
                $('#names .head', $displays).html(headers[0] + ' / ' + headers[1]);
                $('#dateTimes .head', $displays).html(headers[2] + ' / ' + headers[3]);
            } else {
                $('#firstNames .head', $displays).html(headers[0]);
                $('#lastNames .head', $displays).html(headers[1]);
                $('#dates .head', $displays).html(headers[2]);
                $('#times .head', $displays).html(headers[3]);
            }
        }

        if (filteredValues) {
            filterValues();

            stopDisplay();

            if (isPortraitPhone) {
                var $names = $('#names .body', $displays);
                var $firstNames = $('.first-name', $names);
                var $lastNames = $('.last-name', $names);

                var $dateTimes = $('#dateTimes .body', $displays);
                var $dates = $('.date', $dateTimes);
                var $times = $('.time', $dateTimes);

                var existingLength = $firstNames.length;

                for (var i = 0,
                         differencesLength = differences.length;
                     (i < differencesLength) && (i < existingLength);
                     i++) {
                    var difference = differences[i];
                    var value = filteredValues[difference];
                    $($firstNames[difference]).html(displayString(value[0], 10));
                    $($lastNames[difference]).html(displayString(value[1], 10));

                    var parts = value[2]
                        .split('/');
                    parts[2] = parseInt(parts[2]) - 2000;

                    $($dates[difference]).html(displayString(parts.join(''), 6));
                    $($times[difference]).html(displayString(value[3].replace(':', ''), 4));
                }

                differences = [];

                var newValues = filteredValues
                    .slice($firstNames.length);

                $names.append(
                    newValues.map(function (value, index) {
                        return '<div class="row"><div class="departure-line first-name filled">' +
                            displayString(value[0], 10) +
                            '</div></div>' +
                            '<div class="row"><div class="departure-line last-name filled">' +
                            displayString(value[1], 10) +
                            '</div></div>';
                    }).join('')
                );

                $('#dateTimes .body', $displays).append(
                    newValues.map(function (value, index) {
                        var parts = value[2]
                            .split('/');

                        parts[2] = parseInt(parts[2]) - 2000;

                        return '<div class="row"><div class="departure-line date filled">' +
                            displayString(parts.join(''), 6) +
                            '</div></div>' +
                            '<div class="row"><div class="departure-line time filled">' +
                            displayString(value[3].replace(':', ''), 4) +
                            '</div></div>';
                    }).join('')
                );

                function displayString(value, length) {
                    var chars = [];

                    for (var i = 0; i < length; i++) {
                        var char = value[i] || '';
                        /*var delay = line * 0.1/!* + i * 0.05*!/ + i * Math.random() * 0.05;
                        var delay1 = ' style="animation-delay: ' + (delay) + 's;"';
                        var delay2 = ' style="animation-delay: ' + (delay + 0.2) + 's;"';*/

                        chars.push('<div class="digit ' + (char ? 'new' : '') + '">' +
                            '<div class="back top">' + char + '</div>' +
                            '<div class="front bottom">' + char + '</div>' +
                            '</div>');
                    }

                    return chars.join('');
                }
            } else {
                updateDisplay(
                    $('input.first-name', $displays),
                    parseInput(
                        filteredValues.map(function (value) {
                            return value[0]
                        }).join('\n'),
                        namesColCount
                    )
                );

                updateDisplay(
                    $('input.last-name', $displays),
                    parseInput(
                        filteredValues.map(function (value) {
                            return value[1]
                        }).join('\n'),
                        namesColCount
                    )
                );

                updateDisplay(
                    $('input.date', $displays),
                    parseInput(
                        filteredValues.map(function (value) {
                            var parts = value[2]
                                .split('/');

                            parts[2] = parseInt(parts[2]) - 2000;

                            return parts.join('');
                        }).join('\n'),
                        6
                    )
                );

                updateDisplay(
                    $('input.time', $displays),
                    parseInput(
                        filteredValues.map(function (value) {
                            return value[3].replace(':', '')
                        }).join('\n'),
                        5
                    )
                );

                var length = (filteredValues || []).length;
                var screens = Math.ceil(length / rowCount);
                displayTimeout = setTimeout(
                    displayData,
                    (screens + 1) * screenDelay + length * lineDelay + 100
                );
            }
        }
    }

    function parseInput(
        text,
        colCount
    ) {
        var buffer = new DepartureBuffer(colCount, rowCount);
        var lines = text.split(/\n/);

        for (var i in lines) {
            var words = lines[i].split(/\s/);
            for (var j in words) {
                buffer.pushWord(words[j]);
            }
            buffer.flush();
        }

        buffer.flush();
        return buffer.buffers;
    }

    function stopDisplay() {
        for (var i in timers) {
            clearTimeout(timers[i]);
        }

        timers = [];
    }

    function updateDisplay(
        $rows,
        buffers
    ) {
        var timeout = 100;

        for (let i in buffers) {
            $rows.each(function (j) {
                var $display = $($rows[j]);

                (function (i, j) {
                    timers.push(
                        setTimeout(
                            function () {
                                if (buffers[i][j]) {
                                    $display.val(buffers[i][j]).change();

                                } else {
                                    $display.val('').change();
                                }
                            },
                            timeout
                        ));
                }(i, j));

                timeout += lineDelay;
            });

            timeout += screenDelay;
        }
    }

});
