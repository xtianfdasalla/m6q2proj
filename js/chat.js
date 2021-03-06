let started = false;

/** The typing animation. */
let isTyping = `<div class="loading">
	<div></div>
	<div></div>
	<div></div>
</div>`

/**
	Shuffles an array.
	From https://stackoverflow.com/a/2450976
*/
function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

/** The Recipient class. */
class Recipient {
	constructor(first, last, picture, middle = "") {
		/** The first name of the character. */
		this.first = first;

		/** The last name of the character. */
		this.last = last;

		/** The middle name of the character. */
		this.middle = middle;

		/** The picture of the character. */
		this.picture = picture;
	}

	/** Returns the full name of the character. */
	get fullName() {
		return this.middle != "" ? this.first + " " + this.middle + " " + this.last : this.first + " " + this.last;
	}
}

/** The Message class. */
class Message {
	constructor(sender, message) {
		/** The sender of the Message. */
		this.sender = sender;

		/** The Message content. */
		this.message = message;

		/** The JQuery object containing the HTML element of the Message. */
		this.element;
	}

	get html() {
		return `<div class="animated faster fadeInUp ${this.sender == "l" ? "left" : "right"}">${this.message}</div>`
	}

	set el(a) {
		this.element = a;
		return a;
	}

	add() {
		let a = new Promise(function(resolve, reject) {
			let delType = this.sender == "r" ? timeDelay(this.message.replace("//displaystyle", "").length, false, false) : 0;
			if ($("#chat").children().last().is(".choose, .type, .dragdrop")) delType = 0;

			setTimeout(resolve, delType);
		}.bind(this)).then(function(a) {
			let x = $(this.sender == "l" ? `<div class="animated faster fadeInUp left">${isTyping}</div>` : this.html).appendTo($("#chat"));
			this.el = x;
			updateScroll();

			if (x.prev().attr("class").match(new RegExp("\\bleft\\b")) != null && this.sender == "l") {
				x.prev().css("margin-bottom", "1px");
				x.prev().css("border-bottom-left-radius", "5px");
				x.css("border-top-left-radius", "5px");
				x.css("margin-top", "1px");
			} else if (x.prev().attr("class").match(new RegExp("\\bright\\b")) != null && this.sender == "r") {
				x.prev().css("margin-bottom", "1px");
				x.prev().css("border-bottom-right-radius", "5px");
				x.css("border-top-right-radius", "5px");
				x.css("margin-top", "1px");
			}

			let del1 = timeDelay(this.message.length);
			let del2 = timeDelay(this.message.length, true);

			if (this.sender == "l") {
				setTimeout(function() {
					x.html(this.message);
					updateScroll();
					MathJax.typeset();
				}.bind(this), del1);
			} else {
				MathJax.typeset();
			}

			setTimeout(function() {
				queue.next();
			}, del1 + del2);
		}.bind(this));

		return this;
	}
}

/** The Poll class. */
class Poll {
	constructor(question, options, correct) {
		/** The question for the Poll. */
		this.question = question;

		/** An object representing the options for the Poll. */
		this.options = {};

		/** An object representing custom replies to be sent for each choice. */
		this.replies = {};

		/** The choice corresponding to the correct answer. */
		this.correct = correct;

		if (Object.values(options).every(a => a instanceof Array)) {
			for (let i in options) {
				this.options[i] = options[i][0];
				this.replies[i] = options[i][1];
			}
		} else {
			for (let i in options) {
				this.options[i] = options[i];
			}
		}

		/** The JQuery object containing the HTML element corresponding to the Poll. */
		this.element;
	}

	get html() {
		let optionButtonsA = [];
		let optionButtonsS = "";

		for (let i in this.options) {
			optionButtonsA.push(`<button class="choice choice_${i} btn btn-outline-${currentRecipient.first.toLowerCase()}">${this.options[i]}</button>\n`);
		}

		optionButtonsA = shuffle(optionButtonsA);

		for (let j of optionButtonsA) {
			optionButtonsS += j;
		}

		return `<div class="animated faster fadeInUp choose">
<div class="question h5 mt-4">${this.question}</div>
<div class="choices mb-4" tabindex="-1">
${optionButtonsS}
</div>
</div>`
	}

	set el(a) {
		this.element = a;
		return a;
	}

	add() {
		let p = new Promise(function(resolve, reject) {
			setTimeout(resolve, timeDelay(this.question.length, false, false));
		}.bind(this)).then(function(a) {
			let x = $(this.html).appendTo($("#chat"));
			this.el = x;
			updateScroll();

			for (let i of x.find(".choice")) {
				$(i).one("click", function() {
					queue.next($(this));
					$(this).addClass("active");
					$(this).siblings().prop("disabled", true);
				});
			}

			MathJax.typeset();
		}.bind(this));

		return this;
	}
}

/** The TypedPoll class. */
class TypedPoll {
	constructor(question, correct) {
		/** The question to be asked. */
		this.question = question;

		/** The correct answer/s to the question. Can either be a string or an array of strings. */
		this.correct = correct;

		/** The JQuery object containing the HTML element corresponding to the TypedPoll. */
		this.element;

		/** The MathQuill object corresponding to the TypedPoll's input box. */
		this.input;
	}

	/** Returns the HTML markup representing the TypedPoll. */
	get html() {
		return `<div class="animated faster fadeInUp type">
<div class="question h5 mt-4">${this.question}</div>
<div class="input-row mb-4">
	<span class="type-input"></span>
	<button class="btn btn-${currentRecipient.first.toLowerCase()} ml-2 send">Send</button>
</div>
</div>`;
	}

	set el(a) {
		this.element = a;
		return a;
	}

	set in(a) {
		this.input = a;
		return a;
	}

	/** Adds the TypedPoll to #chat. */
	add() {
		let p = new Promise(function(resolve, reject) {
			setTimeout(resolve, timeDelay(this.question.length, false, false));
		}.bind(this)).then(function(a) {
			let x = $(this.html).appendTo($("#chat"));
			updateScroll();

			let i = MQ.MathField($(x).find(".type-input").get(0), {
				spaceBehavesLikeTab: true,
				charsThatBreakOutOfSupSub: '+-',
				handlers: {
					enter: function() {
						queue.next();
						i.blur();
						x.find(".send").prop("disabled", true);
					}
				}
			});

			i.focus();

			x.find(".send").one("click", function() {
				queue.next();
				i.blur();
				$(this).prop("disabled", true);
			});

			this.el = x;
			this.in = i;

			MathJax.typeset();
		}.bind(this));

		return this;
	}
}

class DragDrop {
	constructor(question, options) {
		/** The question for the DragDrop. */
		this.question = question;

		/** The object containing the options to the DragDrop. */
		this.options = options;

		/** The JQuery object containing the HTML element corresponding to the TypedPoll. */
		this.element;
	}

	get html() {
		let drags = [];
		let drops = [];

		for (let i in this.options) {
			drags.push(`<span class="drag-choice drag-choice-${i}" draggable="true">${this.options[i][0]}</span>\n`);
			drops.push(`<span class="drop-choice drop-choice-${i}">${this.options[i][1]}:<span class="dropzone ml-2"></span></span>\n`);
		}

		drags = shuffle(drags);
		drops = shuffle(drops);

		let dragsS = "";
		let dropsS = "";

		for (let j of drags) dragsS += j;
		for (let j of drops) dropsS += j;

		return `<div class="animated faster fadeInUp dragdrop">
<div class="question h5 mt-4">${this.question}</div>
<div class="drags mb-3">
${dragsS}
</div>
<div class="drops mb-4">
${dropsS}
</div>
</div>`
	}

	set el(a) {
		this.element = a;
		return a;
	}

	add() {
		let p = new Promise(function(resolve, reject) {
			setTimeout(resolve, timeDelay(this.question.length, false, false));
		}.bind(this)).then(function(a) {
			let h = $(this.html).appendTo($("#chat"));
			updateScroll();
			MathJax.typeset();

			for (let c of h.find(".drag-choice")) {
				// $(c).on('touchmove', document.preventDefault, {passive: false});

				$(c).on('dragstart', function (e) {
					e.originalEvent.dataTransfer.setData("text/plain", $(e.originalEvent.target).attr("class").match(/drag-choice-./)[0].slice(-1));
					e.originalEvent.dataTransfer.dropEffect = "move";
					$(e.originalEvent.target).addClass("dragging");
				});

				$(c).on('dragend', function (e) {
					e.originalEvent.preventDefault();
					$(e.originalEvent.target).removeClass("dragging");

					if (e.originalEvent.dataTransfer.dropEffect !== 'none') {
						$(this).remove();
					}

					if (!h.find(".drags").children().length) {
						let t = true;

						for (let g of h.find(".drag-placed")) {
							if ($(g).attr("class").match(/drag-choice-./)[0].slice(-1) === $(g).parent().attr("class").match(/drop-choice-./)[0].slice(-1)) continue; else {t = false; break;}
						}

						queue.next(t);
					}
				});
			}

			for (let d of h.find(".dropzone")) {
				$(d).on('dragenter', function(e) {
					e.originalEvent.preventDefault();
					e.originalEvent.dataTransfer.dropEffect = "move";
					$(e.originalEvent.target).addClass("dragenter");
			 	});

				$(d).on('dragleave', function(e) {
					e.originalEvent.preventDefault();
					$(e.originalEvent.target).removeClass("dragenter");
			 	});

				$(d).on('dragover', function(e) {
					e.originalEvent.preventDefault();
					e.originalEvent.dataTransfer.dropEffect = "move";
			 	});

				$(d).on('drop', function(e) {
					e.originalEvent.preventDefault();
					$(e.originalEvent.target).css("border", "");

					let choice = e.originalEvent.dataTransfer.getData("text/plain");
					$(e.originalEvent.target).html(this.options[choice][0]);
					$(e.originalEvent.target).removeClass("dropzone");
					$(e.originalEvent.target).addClass(`drag-choice drag-placed drag-choice-${choice}`);
					MathJax.typeset();
				}.bind(this));
			}

			this.el = h;
		}.bind(this));

		return this;
	}
}

// ==========
// Recipients
// ==========

/** Calisto's Recipient object. */
let cal = new Recipient("Calisto", "Lucero", "cal dp.png");

/** IO's recipient object. */
let io = new Recipient("Ian", "Kona", "io dp.png", "Okelani");

// ===============
// Other functions
// ===============

/**
	Returns a random millisecond duration representing how long it takes to read/type a message of the specified length.

	@param {number} l - Length of message.
	@param {boolean} [read] - Determines whether or not delay should take into account message being read instead of typed. Defaults to false.
	@param {boolean} [animate] - Determines whether or not to add 1 second to output to compensate for message animation. Defaults to true.
*/
function timeDelay(l, read = false, animate = true) {
	/*
	According to my research:
	• average reading speed of a person is around 250 to 300 wpm
	• professional typists type at around 65 to 75 wpm
	• 1 wpm = 4 - 5 cpm
	*/
	if (read) {
		return Math.trunc(d3.randomInt(Math.trunc((60000 / 1000) * l), Math.trunc((60000 / 1500) * l) + 1)() / 2) + (animate ? 1000 : 0);
		// ORIGINAL: return (l * 10) - 100 > 200 ? d3.randomInt((l * 10) - 100, (l * 10) + 100)() : d3.randomInt(200, (l * 10) + 100)();
	} else {
		return Math.trunc(d3.randomInt(Math.trunc((60000 / 260) * l), Math.trunc((60000 / 375) * l) + 1)() / 4) + (animate ? 1000 : 0);
		// ORIGINAL: return (l * 30) - 300 > 600 ? d3.randomInt((l * 30) - 300, (l * 30) + 300)() : d3.randomInt(600, (l * 30) + 300)();
	}
}

/** Toggles the "online" state of the chatmate. */
function toggleOnline() {
	if ($("#online_dot").hasClass("online")) {
		$("#online_dot").removeClass("online");
		$("#online_dot").addClass("offline");
		$("#chat").append(`<div class="status animated faster fadeInUp">${currentRecipient.first} is now offline.</div>`);
	} else {
		$("#online_dot").removeClass("offline");
		$("#online_dot").addClass("online");
		$("#chat").append(`<div class="status animated faster fadeInUp">${currentRecipient.first} is now online.</div>`);
	}
	updateScroll();
}

/** Updates scroll position based on addition(s) to the chat. */
function updateScroll() {
	window.scroll({top: $("body").css("height").slice(0, -2), left: 0, behavior: 'smooth'});
}
