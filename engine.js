
/*

The Marriage

Original game by Rod Humble
http://www.rodvik.com/rodgames/marriage.html

HTML Canvas port by Giacomo Preciado
Game: kyrie.pe/the_marriage
GitHub: https://github.com/giacomopc/the-marriage 

*/

var InvalidMousePosition = vector2(-1000, -1000)
var mScreen
var mCanvas
var mContext
var mBackgroundColor = 'black'

var mTime
var mStartTime
var mPrevFrameTime
var mDeltaTime
var mTimeScale = 1

var mMousePosition = InvalidMousePosition
var mMouseClicked = false
var mMouseMoved = false

window.requestAnimFrame = (function(callback) 
{
	return window.requestAnimationFrame 
		|| window.webkitRequestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame 
		|| function(callback) {
	 			window.setTimeout(callback, 1000 / 60)
		}
})()

function gameLoop()
{
	earlyLogic()

	//Implemented by the game
	logic()

	mContext.clearRect(0, 0, mScreen.width, mScreen.height)
	draw()

	lateLogic()
	requestAnimFrame(function() { gameLoop() })
}

function engineStart()
{
	mCanvas = document.getElementById('canvas')

	// Support for HiDPI displays
	var ratio = window.devicePixelRatio || 1
	mScreen = rect(0, 0, 800, 600)
	mCanvas.width = mScreen.width * ratio
	mCanvas.height = mScreen.height * ratio
	mCanvas.style.width = '' + mScreen.width + 'px'
	mCanvas.style.height = '' + mScreen.height + 'px'
	mCanvas.style.backgroundColor = 'black'

	mContext = mCanvas.getContext('2d')
	mContext.scale(ratio, ratio)
	mContext.translate(0.5, 0.5)
	
	mStartTime = getTime()
	mPrevFrameTime = getTime()
	

	mCanvas.onmousemove = function(event)
	{
		var rect = mCanvas.getBoundingClientRect();
		var x = event.clientX - rect.left
		var y = event.clientY - rect.top
		mMousePosition = vector2(x, y)
		mMouseMoved = true
	}

	mCanvas.onclick = function(event)
	{
		mMouseClicked = true
	}

	mCanvas.onmouseout = function(event)
	{
		mMousePosition = InvalidMousePosition
	}

	start()
	gameLoop()
}


function drawRect(x, y, width, height)
{
	mContext.beginPath()
	mContext.rect(x, y, width, height)
	mContext.fillStyle = rgbaToString(rgba(100, 0, 0, 0.5))
	mContext.fill()
}

function drawRect(rect, fillColor, strokeColor)
{
	mContext.beginPath()
	mContext.rect(rect.x, rect.y, rect.width, rect.height)
	drawCurrentPath(fillColor, strokeColor)
}

function drawCircle(circle, fillColor, strokeColor)
{
	mContext.beginPath()
	mContext.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI)
	drawCurrentPath(fillColor, strokeColor)
}

function drawText(text, position, size, alignment, color)
{
	mContext.fillStyle = rgbaToString(color)
	mContext.font = '' + size + 'pt Arial Black'
	mContext.textAlign = alignment
	mContext.fillText(text, position.x, position.y)
}

function drawCurrentPath(fillColor, strokeColor)
{
	if(fillColor.a != 0.0)
	{
		mContext.fillStyle = rgbaToString(fillColor)
		mContext.fill()
	}

	if(strokeColor.a != 0.0) 
	{
		mContext.strokeStyle = rgbaToString(strokeColor)
		mContext.stroke()
	}
}

function earlyLogic()
{
	//// Time
	var time = getTime()
	mDeltaTime = Math.min((time - mPrevFrameTime), 1.0 / 30.0) * mTimeScale
	mPrevFrameTime = time
}

function lateLogic()
{
	mMouseClicked = false
	mMouseMoved = false
}

function getTime()
{
	return (new Date()).getTime() / 1000.0
}

//// Utilities

function rgba(red, green, blue, alpha)
{
	return {r: red, g: green, b: blue, a: alpha}
}

function rgbaToString(rgba)
{
	return 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + rgba.a + ')' 
}

function rgbaWithAlpha(rgb, alpha)
{
	return rgba(rgb.r, rgb.g, rgb.b, alpha) 	
}

function isPointInsideRect(point, rect)
{
	return point.x > rect.x && point.x < rect.x + rect.width &&
		point.y > rect.y && point.y < rect.y + rect.height ? true : false
}

function isRectInsideRect(rect1, rect2)
{
	var a = rect1
	var b = rect2
	return a.x < b.right() && b.x < a.right() && a.y < b.bottom() && b.y < a.bottom()
}

function distance(point1, point2)
{
	var dx = Math.abs(point1.x - point2.x)
	var dy = Math.abs(point1.y - point2.y)
	return Math.sqrt(dx * dx + dy * dy)
}
function isPointInsideCircle(point, circle)
{
	return distance(point, circle.center()) < circle.radius
}

function clamp(number, min, max)
{
	return Math.max(Math.min(number, max), min)
}

function clamp01(number, min, max)
{
	return clamp(number, 0, 1)
}

function rect(x, y, width, height)
{
	return { x: x,  y: y,  width: width, height: height, 
	
		right: function() 
		{ 
			return this.x + this.width 
		},

		bottom: function()
		{
			return this.y + this.height
		},

		center: function()
		{
			return vector2(this.x + this.width / 2, this.y + this.height / 2)
		}
	}
}

function circle(x, y, radius)
{
	return { x: x, y: y, radius: radius,

		center: function()
		{
			return vector2(this.x, this.y)
		}
	}
}

function debug(string)
{
	console.log(string)
}

function randomInRange(x1, x2)
{
	return x1 + Math.random() * (x2 - x1)
}

function randomObjectFromArray(array)
{
	return array[Math.floor(Math.random() * array.length)]
}

function isRectInsideCircle(rect, circle)
{
	var distX = Math.abs(circle.x - rect.x - rect.width / 2)
	var distY = Math.abs(circle.y - rect.y - rect.height / 2)

	if (distX > (rect.width / 2 + circle.radius) 
	|| distY > (rect.height / 2 + circle.radius))
		return false

	if (distX <= (rect.width / 2) 
	|| distY <= (rect.height / 2))
		return true

	var dx = distX - rect.width / 2;
	var dy = distY - rect.height / 2;
	return dx * dx + dy * dy <= circle.radius * circle.radius
}


// vector2

function vector2(x, y)
{
	return { x: x, y: y,

		normalized: function()
		{
			var length = Math.sqrt(x * x + y * y)
			return vector2(x / length, y / length)
		},

		negated: function()
		{
			return vector2(-x, -y)
		}
	}
}

function vector2subtract(vectorA, vectorB)
{
	return vector2(vectorB.x - vectorA.x, vectorB.y - vectorA.y)
}

