
/*

The Marriage

Original game by Rod Humble
http://www.rodvik.com/rodgames/marriage.html

HTML Canvas port by Giacomo Preciado
Game: kyrie.pe/the_marriage
GitHub: https://github.com/giacomopc/the-marriage 

*/


//// Constants

// Colors

var FemaleColor = rgba(244, 94, 184, 1.0)
var MaleColor = rgba(62, 83, 240, 1.0)

var Blue = rgba(86, 131, 178, 1.0)
var Purple = rgba(147, 52, 199, 1.0)
var Pink = rgba(203, 59, 200, 1.0)
var Green = rgba(2, 197, 41, 1.0)
var Gray = rgba(39, 39, 39, 1.0)

var SplashBackgroundColor = Blue
var BackgroundColors = [Blue, Purple, Pink, Green, Gray, Gray]

// Elements

var BlackElement = rgba(41, 56, 80, 0.65)

var ElementColors = [
	rgba(171, 207, 93, 0.65), 	// Green 1
	rgba(189, 219, 107, 0.65),	// Green 2
	rgba(225, 246, 149, 0.65),	// Green 3
	rgba(206, 233, 129, 0.65),	// Green 4
	rgba(249, 244, 240, 0.65),	// Gray
	BlackElement				// Black
]


// Positions

var TitleRect = rect(275, 223, 248, 43)
var FemalePosition = vector2(527, 243)
var MalePosition = vector2(244, 242)
var ElementRadius = 21
var CharacterSide = 32
var CircleMemoryRadius = 10
var KissSide = 4


// Gameplay

var FemaleKissGrowth = 12
var FemaleHitsElementGrowth = 3
var FemaleHitsBlackElementGrowth = -12
var FemaleGrowthWhenElementDisappears = -7
var FemaleLifeIncreaseOnKiss = 0.15
var FemaleLifeOverTime = -0.0129
var FemaleLifeMultiplierOnLevel5 = 1.18
var FemaleGrowthOverTime = -0.1

var MaleHitsElementGrowth = 12
var MaleHitsElementLifeIncrease = 0.23
var MaleHitsBlackElementGrowth = -19
var MaleLifeIncreaseOnKiss = -0.23
var MaleGrowthSpeedOnCharacterTouch = -15.3
var MaleSprintSpeed = 32
var MaleMinSprintTime = 2
var MaleMaxSprintTime = 10

var MemoryBarInitialHeight = -20
var MemoryBarGrowthSpeed = -1
var MemoryBarGrowthOnKiss = 11 
var MemoryBarGrowthWhenFemaleHitsElement = 6
var MemoryBarGrowthWhenMaleHitsElement = 7
var MemoryBarGrowthWhenFemaleHitsBlackElement = 1
var MemoryBarGrowthWhenMaleHitsBlackElement = 1

var MinLifeToBeAlive = 0.05
var CharacterSpeed = 18.75 

var KissMemoryCreationInterval = 0.02
var KissMemorySpeed = 25.75

var MemorySpeed = 12
var SquareMemoryDuration = 4.5
var StaticCircleMemoryDuration = 2.5

var ElementLifeOnScreen = 37.5
var ElementsCreationInterval = [2, 3, 4, 5, 20, 30]

var StartCrossfadeDuration = 1
var GameOverFadeOutDuration = 2.5

var LevelDuration = 60


// States

var Gender = {
	Female: 0,
	Male: 1
}

var Scene = {
	Splash: 0,
	Game: 1
}

var Direction = {
	Down: 0,
	Up: 1
}

var ElementState = {
	Alive: 0, 
	Disappearing: 1,
	Gone: 2
}

var MemoryType = {
	Circle: 0,
	StaticCircle: 1,
	Square: 2
}

//// Variables

// Game

var mCrossfade
var mCrossfadeTime
var mHasGameStarted
var mGameTime
var mGameOver
var mGameOverTime
var mEnding
var mEndingTime

var mCurrentLevel
var mIsCoupleTogether
var mTimeSinceLastElementCreated
var mFirstBounce
var mMaleSprintRemainingTime

// Game objects

var mFemale, mMale
var mElements
var mMemories
var mMemoryBar
var mKisses



//// Classes

function Character (gender)
{
	var isFemale = (gender == Gender.Female)
	var position = isFemale ? FemalePosition : MalePosition

	this.gender = gender
	this.color = isFemale ? FemaleColor : MaleColor
	this.rect = rect(position.x, position.y, CharacterSide, CharacterSide)
	this.life = 1
	this.direction = isFemale ? vector2(-1, 0) : vector2(1, 0)


	this.logic = function()
	{
		// Movement
		var speed = (this.gender == Gender.Male && mMaleSprintRemainingTime > 0) ? 
			MaleSprintSpeed : 
			CharacterSpeed
		
		this.rect.x += this.direction.x * speed * mDeltaTime
		this.rect.y += this.direction.y * speed * mDeltaTime


		// Mouse pointer touches character
		if(isPointInsideRect(mMousePosition, this.rect))
		{
			mMale.expand(MaleGrowthSpeedOnCharacterTouch * mDeltaTime)
			attract()
		}

		// Intersection with elements
		for(var index in mElements)
		{
			var element = mElements[index]
			if(element.state == ElementState.Alive 
			&& isRectInsideCircle(this.rect, element.circle))
			{
				var memoryType

				if(element.color == BlackElement)
				{
					memoryType = MemoryType.StaticCircle
					
					if(this.gender == Gender.Female)
					{
						this.expand(FemaleHitsBlackElementGrowth)
					}
					else
					{
						this.expand(MaleHitsBlackElementGrowth)
					}
				} 
				else
				{
					memoryType = MemoryType.Circle
					
					if(this.gender == Gender.Female)
					{
						this.expand(FemaleHitsElementGrowth)	
						mMemoryBar.expand(MemoryBarGrowthWhenFemaleHitsElement)
					}
					else
					{
						this.expand(MaleHitsElementGrowth)
						this.life += MaleHitsElementLifeIncrease
						mMemoryBar.expand(MemoryBarGrowthWhenMaleHitsElement)
					}
				}

				var memory = new Memory(memoryType, element.circle.center())
				mMemories.push(memory)

				element.disappear()
			}
		}

		// Female mechanics
		if(this.gender == Gender.Female)
		{
			// TODO: get exact constants
			this.expand(FemaleGrowthOverTime * mDeltaTime)
			var lifeIncrease = FemaleLifeOverTime * mDeltaTime
			if(mCurrentLevel == 5) lifeIncrease *= FemaleLifeMultiplierOnLevel5
			this.life += lifeIncrease
		}
		// Male mechanics
		else if(mMaleSprintRemainingTime > 0)
		{
			mMaleSprintRemainingTime -= mDeltaTime	
		} 

		this.life = clamp(this.life, 0, 1)

		// Bouncing on screen borders
		var initialRect = this.initialRect()

		if(initialRect.right() > mScreen.width || initialRect.x < 0)
		{
			this.direction.x *= -1
		}
		if(initialRect.bottom() > mScreen.height || initialRect.y < 0)
		{
			this.direction.y *= -1
		}


		// Game over conditions
		if(this.rect.width <= 0 || this.rect.height <= 0)
		{
			this.rect.width = 0
			this.rect.height = 0

			gameOver()
		}

		if(this.life <= MinLifeToBeAlive)
		{
			gameOver()
		}
	}

	this.draw = function()
	{
		if(mEnding) return;

		mContext.beginPath()
		mContext.rect(
			Math.floor(this.rect.x), 
			Math.floor(this.rect.y), 
			Math.floor(this.rect.width), 
			Math.floor(this.rect.height)
		)

		mContext.fillStyle = rgbaToString(rgba(this.color.r, this.color.g, this.color.b, this.life))
		mContext.fill()
		mContext.lineWidth = 1
		mContext.strokeStyle = rgbaToString(rgba(0, 0, 0, this.life))
		mContext.stroke()
	}

	this.expand = function(amount)
	{
		this.rect.x -= amount / 2
		this.rect.y -= amount / 2
		this.rect.width += amount
		this.rect.height += amount
	}

	this.initialRect = function()
	{
		var center = this.rect.center()
		
		return rect(
			center.x - CharacterSide / 2, 
			center.y - CharacterSide / 2, 
			CharacterSide, 
			CharacterSide
		)
	}
}

function Element()
{
	var x = randomInRange(ElementRadius, mScreen.width - ElementRadius)
	var y = ElementRadius

	this.circle = circle(x, y, ElementRadius)
	this.color = (mCurrentLevel == 5) ? BlackElement : randomObjectFromArray(ElementColors)
	this.state = ElementState.Alive
	this.fadeOutTime = 0
	this.time = 0	

	this.logic = function()
	{
		if(this.state == ElementState.Alive)
		{
			// Movement
			this.time += mDeltaTime

			var height = mScreen.height
			var Duration = ElementLifeOnScreen
			 
			this.circle.y = height - Math.abs(this.time / Duration - 0.5) * height * 2 - this.circle.radius
			
			if(this.time >= Duration / 2 && this.circle.y - this.circle.radius <= 0)
			{
				this.state = ElementState.Disappearing
				this.circle.y = this.circle.radius
			}
			
			// Mouse pointer touches element
			if(isPointInsideCircle(mMousePosition, this.circle))
			{
				this.state = ElementState.Disappearing
				mFemale.expand(FemaleGrowthWhenElementDisappears)
			}	
		}


		if(this.state == ElementState.Disappearing)
		{
			// Element fadeout
			this.fadeOutTime += mDeltaTime
			if(this.fadeOutTime > 1) this.state = ElementState.Gone
		}

		if(this.state == ElementState.Gone)
		{
			// Delete element from array
			var index = mElements.indexOf(this)
			mElements.splice(index, 1)
		}
	}

	this.draw = function()
	{
		mContext.beginPath()
		mContext.arc(this.circle.x, this.circle.y, this.circle.radius, 0, 2 * Math.PI)
		
		var alpha = (1 - this.fadeOutTime) * this.color.a
		mContext.fillStyle = rgbaToString(rgbaWithAlpha(this.color, alpha))
		mContext.fill()
		mContext.lineWidth = 1
		mContext.strokeStyle = rgbaToString(rgba(0, 0, 0, alpha))
		mContext.stroke()
	}

	this.disappear = function()
	{
		this.state = ElementState.Disappearing
	}

}


function Memory(type, position)
{
	this.position = position
	this.type = type
	this.direction = vector2(0, 0)
	this.time = 0
	this.alpha = 1

	if(type == MemoryType.Circle || type == MemoryType.Square)
	{
		this.direction = vector2subtract(position, mMale.rect.center()).normalized()
	}

	this.logic = function()
	{
		// Movement
		this.position.x += this.direction.x * MemorySpeed * mDeltaTime
		this.position.y += this.direction.y * MemorySpeed * mDeltaTime

		// Time on screen
		this.time += mDeltaTime

		if(this.type == MemoryType.StaticCircle)
		{
			var duration = StaticCircleMemoryDuration
			this.alpha = (duration - this.time) / duration
			if(this.time >= duration) this.destroy()
		}

		if(this.type == MemoryType.Square)
		{
			if(this.time >= SquareMemoryDuration) this.destroy()
		}

		if(this.type == MemoryType.Circle)
		{
			var memoryCircle = circle(this.position.x, this.position.y, this.CircleMemoryRadius)
			if(!isRectInsideCircle(mScreen, memoryCircle)) this.destroy()
		}
	}

	this.draw = function()
	{
		mContext.beginPath()

		if(this.type == MemoryType.Square)
		{
			var Side = 12
			mContext.rect(
				this.position.x - Side / 2, 
				this.position.y - Side / 2, 
				Side, 
				Side)
		}
		else
		{
			
			mContext.arc(this.position.x, this.position.y, CircleMemoryRadius, 0, 2 * Math.PI)
		}

		mContext.lineWidth = 1
		mContext.strokeStyle = rgbaToString(rgba(255, 255, 255, 0.07 * this.alpha))
		mContext.stroke()
	}

	this.destroy = function()
	{
		// Delete memory from array
		var index = mMemories.indexOf(this)
		mMemories.splice(index, 1)
	}
}

function MemoryBar()
{
	this.MinHeight = MemoryBarInitialHeight
	this.height = MemoryBarInitialHeight

	this.logic = function()
	{
		// When the grey level appears, the memory bar grows instead of shrinking
		var factor = mCurrentLevel > 3 ? -1 : 1
		this.expand(mDeltaTime * MemoryBarGrowthSpeed * factor)
	}

	this.draw = function()
	{
		mContext.beginPath()
		mContext.rect(
			Math.floor(-0.5), 
			Math.floor(mScreen.height - this.height),
			Math.floor(mScreen.width + 1), 
			Math.floor(this.height + 1)
		)
		mContext.fillStyle = rgbaToString(rgba(255, 255, 255, 0.5))
		mContext.fill()
	}

	this.expand = function(amount)
	{
		this.height = Math.max(this.MinHeight, this.height + amount)
	}
}

function KissMemory(gender, center)
{
	this.color = gender == Gender.Female ? FemaleColor : MaleColor
	this.direction = randomDirection()
	this.rect = rect(center.x - KissSide / 2, center.y - KissSide / 2, KissSide, KissSide)
	this.active = false

	this.logic = function()
	{
		if(this.active)
		{
			var Speed = KissMemorySpeed
			this.rect.x += this.direction.x * mDeltaTime * Speed
			this.rect.y += this.direction.y * mDeltaTime * Speed
		}
	}

	this.draw = function()
	{
		if(this.active)
		{
			mContext.beginPath()
			mContext.fillStyle = rgbaToString(this.color)
			mContext.rect(this.rect.x, this.rect.y, this.rect.width, this.rect.height)
			mContext.fill()
		}
	}
}

//// Methods

// Engine game loop methods

function start()
{
	setup()
}

function logic()
{

	// Start screen
	if(!mHasGameStarted)
	{
		if(mCrossfade == true)
		{
			mCrossfadeTime += mDeltaTime
			clamp(mCrossfadeTime, 0, StartCrossfadeDuration)

			if(mCrossfadeTime > StartCrossfadeDuration)
			{
				mHasGameStarted = true
				mCrossfade = false
			}
		}
		else if((isPointInsideRect(mMousePosition, TitleRect) && mMouseMoved) || mMouseClicked == true)
		{			
			newGame()
		}
	}
	
	// Game screen
	else 
	{
		// Game over transition
		if(mGameOver)
		{
			mGameOverTime = clamp(mGameOverTime + mDeltaTime, 0, GameOverFadeOutDuration)
			if(mGameOverTime == GameOverFadeOutDuration) setup()
		}
		// Game running
		else
		{	
			mGameTime += mDeltaTime
			
			if(mEnding)
			{
				endingLogic()
			}
			else
			{
				levelLogic()
				elementGenerator()
				
				mMale.logic()
				mFemale.logic()

				for(var i in mElements)	mElements[i].logic()
				for(var i in mMemories)	mMemories[i].logic()	
			
				// Character logic
				var isCoupleTogether = isRectInsideRect(mMale.rect, mFemale.rect)
				if(isCoupleTogether && !mIsCoupleTogether) kiss()
				mIsCoupleTogether = isCoupleTogether

				if(mMouseClicked) gameOver()
			}
			
			mMemoryBar.logic()

			//DEBUG_ending()
		}
	}
}

function draw()
{	
	mContext.clearRect(0, 0, mScreen.width, mScreen.height)
	
	drawBackground()

	mMemoryBar.draw()

	mMale.draw()
	mFemale.draw()

	for(var i in mElements)	mElements[i].draw()
	for(var i in mMemories)	mMemories[i].draw()
	for(var i in mKisses) mKisses[i].draw()

	drawSplash(1 - mCrossfadeTime)	

	if(mGameOver) drawFadeOut()

	/*
	mContext.fillStyle = 'white'
	mContext.font = '12pt Arial Black'
	mContext.textAlign = 'left'
	mContext.fillText(
		'Female alpha ' + DEBUG_roundedDigits(mFemale.life) + 
		' / Male alpha ' + DEBUG_roundedDigits(mMale.life) + '\n' + DEBUG_angle(), 
		22, mScreen.height - 27)
	*/
}

// Logic and drawing methods

function levelLogic()
{
	// Change background color depending on level
	// each level lasts 60 seconds
	var minutesPassed = Math.floor(mGameTime / LevelDuration)
	mCurrentLevel = clamp(minutesPassed, 0, BackgroundColors.length - 1)
	mBackgroundColor = BackgroundColors[mCurrentLevel]
}

function elementGenerator()
{
	mTimeSinceLastElementCreated += mDeltaTime
	
	if(mTimeSinceLastElementCreated > ElementsCreationInterval[mCurrentLevel])
	{
		mElements.push(new Element())
		mTimeSinceLastElementCreated = 0
	}
}

function setup()
{
	mCrossfadeTime = 0
	mCrossfade = false
	mHasGameStarted = false
	mGameTime = 0
	mGameOver = false
	mGameOverTime = 0
	mTimeSinceLastElementCreated = 0
	mEnding = false
	mEndingTime = 0
	mFirstBounce = true

	mCurrentLevel = 0
	mIsCoupleTogether = false

	mBackgroundColor = SplashBackgroundColor

	// Create objects
	mFemale = new Character(Gender.Female)
	mMale = new Character(Gender.Male)
	
	mElements = []
	mMemories = []
	mKisses = []

	mMemoryBar = new MemoryBar()

	mTimeScale = 1
}

function drawFadeOut()
{
	mContext.beginPath()
	mContext.fillStyle = rgbaToString(rgba(0,0,0,mGameOverTime))
	mContext.rect(-0.5, -0.5, mScreen.width, mScreen.height)
	mContext.fill()
}

function drawBackground()
{
	mContext.beginPath()
	mContext.fillStyle = rgbaToString(mBackgroundColor)
	mContext.rect(-0.5, -0.5, mScreen.width, mScreen.height)
	mContext.fill()
}

function drawSplash(alpha)
{
	if(alpha <= 0.0) return;

	// Background
	mContext.beginPath()
	mContext.rect(0, 0, mScreen.width, mScreen.height)
	mContext.fillStyle = rgbaToString(rgbaWithAlpha(SplashBackgroundColor, alpha))
	mContext.fill()
	

	//// Text
	mContext.fillStyle = rgbaToString(rgba(255, 255, 255, alpha))
	
	// Title
	mContext.font = '25pt Arial Black'
	mContext.textAlign = 'center'
	mContext.fillText('The marriage', 400, 255)

	// Credits
	mContext.font = '12pt Arial Black'
	mContext.textAlign = 'right'
	mContext.fillText('Rod Humble 2006', mScreen.width - 22, mScreen.height - 27)

}

function newGame()
{
	mCrossfade = true
}



function gameOver()
{
	if(mEnding == true) return;

	if(mCurrentLevel < 4 )
	{
		mGameOver = true
	}
	else
	{
		mEnding = true
		mEndingTime = mGameTime
		mElements = []
		mMemories = []
	}
}

function attract()
{
	var direction = vector2subtract(mFemale.rect.center(), mMale.rect.center())
	direction = direction.normalized()

	mFemale.direction = direction
	mMale.direction = direction.negated()
}

function kiss()
{
	mFemale.expand(FemaleKissGrowth)
	mFemale.direction = bounceDirection(mFemale.direction, false)
	mFemale.life += FemaleLifeIncreaseOnKiss

	mMale.direction = bounceDirection(mFemale.direction, true)
	mMale.life += MaleLifeIncreaseOnKiss

	mMaleSprintRemainingTime = randomInRange(MaleMinSprintTime, MaleMaxSprintTime)

	if(mFirstBounce)
	{
		mFemale.direction = vector2(2,1).normalized()
		mMale.direction = vector2(-2,1).normalized()
		mFirstBounce = false
	}

	mMemoryBar.expand(MemoryBarGrowthOnKiss)

	// Create memory
	var memory = new Memory(MemoryType.Square, mFemale.rect.center())
	mMemories.push(memory)

	// Save character positions
	var femaleKissInfo = new KissMemory(Gender.Female, mFemale.rect.center())
	var maleKissInfo = new KissMemory(Gender.Male, mMale.rect.center())

	mKisses.push(femaleKissInfo)
	mKisses.push(maleKissInfo)
}

function endingLogic()
{
	var endingTimeElapsed = mGameTime - mEndingTime
	var visibleElements = Math.floor((endingTimeElapsed / KissMemoryCreationInterval) * 2)
	//console.log("ending time " + endingTimeElapsed)
	//console.log("vE " + visibleElements)

	var kissesOutsideScreen = 0

	
	for(var i in mKisses)
	{
		if(i < visibleElements)	
		{
			var kiss = mKisses[i]
			kiss.active = true
			kiss.logic()

			if(!isRectInsideRect(kiss.rect, mScreen )) kissesOutsideScreen++
		}
		else
		{
			break
		}
	}

	if(kissesOutsideScreen == mKisses.length || mMouseClicked) mGameOver = true
}



function bounceDirection(dir, print)
{

	var randomAngle = randomInRange(-0.70 * Math.PI, 0.70 * Math.PI)

	if(print) console.log(randomAngle)
	var angle = angleFromDirection(dir.negated()) + randomAngle
	return vector2(Math.cos(angle), Math.sin(angle))
}


function angleFromDirection(direction)
{
	var angle = Math.atan2(direction.y, direction.x)
	if (angle < 0) angle += 2 * Math.PI
	return angle 	
}

function randomDirection()
{
	var angle = randomInRange(0, 2 * Math.PI)
	var y = Math.tan(angle)
	var x = 1 / y
	return vector2(x, y).normalized()
}


// Debugging methods
// To be deleted

function DEBUG_drawRect(rect)
{
	mContext.beginPath()
	mContext.strokeStyle = rgbaToString(rgba(0, 255, 0, 1.0))
	mContext.rect(rect.x, rect.y, rect.width, rect.height)
	mContext.stroke()
}

function DEBUG_drawRect(rect, color)
{
	mContext.beginPath()
	mContext.strokeStyle = rgbaToString(rgba(0, 255, 0, 1.0))
	mContext.fillStyle = rgbaToString(color)
	mContext.rect(rect.x, rect.y, rect.width, rect.height)
	mContext.fill()
	mContext.stroke()
}

function DEBUG_roundedDigits(n)
{
	return Math.floor(n * 100) / 100
}

function DEBUG_ending()
{
	if(mEnding == false && mGameTime > 100)
	{
		mEnding = true
		mEndingTime = mGameTime
		mElements = []
		mMemories = []
	}
}

function DEBUG_angle()
{
	var atan2 = Math.floor(Math.atan2(mMale.direction.y, mMale.direction.x) * 180 / Math.PI * 100) / 100
	return "Female angle: " + atan2
}