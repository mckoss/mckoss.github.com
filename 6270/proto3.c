int fBallRelease = 0;

/* Move recording buffer */

int xRec[100];
int yRec[100];
int iRecNext = 0;

/* Move index buffer */
int rgirecMin[10];
int rgirecMax[10];

void main()
{
  Setup();
  MainMenu();
}

int func;
int funcLast;

void MainMenu()
{
  func = -1;

  while (!stop_button())
    {
    funcLast = func;
    func = ScaleKnob(1, 27);

    if (FDispMenu(1, "Calibrate Lookdown")) CalibrateLookdown();
    if (FDispMenu(2, "Compete!")) Compete();
    if (FDispMenu(3, "Placebo")) Placebo();
    if (FDispMenu(4, "Dance!")) Chop(10);
    if (FDispMenu(5, "Calibrate Soft")) CalibrateSoft();
    if (FDispMenu(6, "Calibrate Hard")) CalibrateHard();
    if (FDispMenu(7, "Speed Calibration")) CalibrateSpeed();

    if (FDispMenu(8, "Lookdown Test")) LookdownTest();
    if (FDispMenu(9, "Orientation")) Orient();
    if (FDispMenu(10, "Straight 1000")) Move(1000,1000);
    if (FDispMenu(11, "Left 90 Soft")) Soft(90, 1);
    if (FDispMenu(12, "Left 90 Hard")) Hard(90);

    if (FDispMenu(13, "Find Line")) FindLine();
    if (FDispMenu(14, "Line Follow")) LineFollower();

    if (FDispMenu(15, "Record"))
      RecordMove(WSetting("Record move", 0, 9));
    if (FDispMenu(16, "Playback"))
      PlayMove(WSetting("Play move", 0, 9));

    /* hbtest.c functions */

    if (FDispMenu(17, "Servo Test")) ServoTest();
    if (FDispMenu(18, "Calibrate Gate")) CalibrateGate();
    if (FDispMenu(19, "Soft Turn Test")) SoftTest();
    if (FDispMenu(20, "Hard Turn Test")) HardTest();
    if (FDispMenu(21, "Spin Test!")) Spinner();
    if (FDispMenu(22, "Shake Test!")) Shaker();
    if (FDispMenu(23, "Bump Test")) BumpTest();

    if (FDispMenu(24, "Test Motors")) testmotors();
    if (FDispMenu(25, "Test Digitals")) testdigitals();
    if (FDispMenu(26, "Test Analogs")) testanalogs();
    if (FDispMenu(27, "Assert Enable")) AssertEnable();
    }
}

#define START_LIGHT_PORT 4

void Compete()
{
  int i;

  ir_transmit_off();
  fAssertEnable = YesNo("Debug");
  kill_process(ipMotor);
  if (YesNo("Start Light"))
    start_machine(START_LIGHT_PORT);
  ipMotor = start_process(MotorDriver());
  CompeteInit(0);
  Orient();
  while (1)
    {
    FindLine();
    CollectBalls();
    /* BUG: We don't really know if we have a ball here */
    DumpBall();
    ReturnForMore();
    }
  printf("C1");
}

void ReturnForMore()
{
  while (1)
    {
    Lookdown();
    if (iSight == 2-iMe)
      {
      break;
      }
    Move(700, 700);
    if (fBlocked)
    	Unbind();
    Hard(45);
    if (fBlocked)
    	Unbind();
    }
}

void CollectBalls()
{
  Hard(90);
  Move(-80,-80);
  Move(30, 30);
  Gate(0);
  fBallRelease = 1;
  Move(500, 500);
  pwrMax = 60;
  Move(-10, -10);
  Gate(1);
  fBallRelease = 0;
  msleep(250L);
  Move(-20, -20);
  pwrMax = 100;
  Move(-600,-600);
  msleep(250L);
  Move(80, 80);
  Hard(110);
  Move(-200,-200);
  Move(700, 700);
}

void DumpBall()
{
  DebugStop("Dump Ball");
  while (1)
    {
    Lookdown();
    if (iSight == iMe)
      {
      DebugStop("Dumping");
      fBallRelease = 1;
      Gate(0);
      Hard(-70);
      msleep(1000L);
      if (fBlocked)
      	Unbind();
      Move(-200,-200);
      Move(50, 50);
      Hard(-90);
      fBallRelease = 0;
      fBall = 0;
      break;
      }
    Move(300, 300);
    if (fBlocked)
    	{
    	if (rgfBlock[3]) Hard(-10);
    	else Hard(10);
    	}
    }
}

int rgiside[] = {0,0,0,2,0,2,2,2};
int rgdir[] = {2, 3, 1, 0, 0, 1, 3, 2};

int iMe;
int dirOrient;

void Orient()
{
  int i;

  Lookdown();
  i = rgiTable[0] * 4 + rgiTable[1] * 2 + rgiTable[2];

  Assert((i & 1) == 0, "O4");
  i >>= 1;

  iMe = rgiside[i];
  dirOrient = rgdir[i];

  printf("I: %d Side: %d Dir: %d\n", i, iMe, dirOrient);
  if (fAssertEnable)
    StartPress();

  if (dirOrient == 0)
    {
    Move(-150, -150);
    Hard(-180);
    }
  if (dirOrient == 1)
    {
    Hard(80);
    Move(200,200);
    }
  if (dirOrient == 3)
    {
    Soft(-20, 0);
    Soft(-70, 1);
    Move(200,200);
    }

  if (fAssertEnable)
    StartPress();
}

void Unbind()
{
  fForce = 1;
  if (rgfBlock[0] || rgfBlock[1])
  	Move(15, 15);
  else
    Move(-15, -15);
  fForce = 0;
}

persistent int fAssertEnable = 0;

void Assert(int f, char st[])
{
  if (!fAssertEnable || f) return;
  beep();beep();beep();
  printf("Assert failed: %s\n", st);
  StartPress();
}

void AssertEnable()
{
  fAssertEnable = WSetting("Assert", 0, 1);
}

int FDispMenu(int funcSel, char stMenu[])
{
  if (func != funcSel)
    return 0;

  if (start_button() && func == funcLast)
    {
    while (start_button());
    func = -1;
    return 1;
    }

  if (func != funcLast)
    printf("%s\n", stMenu);
  return 0;
}

void NYI()
{
  beep();
  printf("NYI\n");
  sleep(2.0);
}

void CalibrateSoft()
{
  CalibrateTurn(0, rgcSoft);
}

void CalibrateHard()
{
  CalibrateTurn(1, rgcHard);
}

void CalibrateTurn(int fHard, int rgc[])
{
  int i;
  int fContinue = 1;

  while (fContinue)
    {
    i = WSetting("Left 90's", 1, 4);
    rgc[i] = CalibrateSetting(rgc[i], "Ticks");
    if (fHard)
      Move(-rgc[i], rgc[i]);
    else
		{
		Move(0, rgc[i]);
		Move(200, 200);
		StartPress();
		Move(rgc[i], 0);
		}
    Move(200, 200);
    fContinue = YesNo("Continue");
    }
}

int CalibrateSetting(int w, char st[])
{
  printf("%s: %d\n", st, w);
  StartPress();
  w = WSetting(st, MultDiv(w, 80, 100), MultDiv(w, 120, 100));
  return w;
}

int YesNo(char st[])
{
  printf("%s? (Start=Y, Stop=N):\n", st);
  
  while (1)
    {
    if (start_button()) {while (start_button()); return 1;}
    if (stop_button()) {while (stop_button()); return 0;}
    }
}

int WSetting(char st[], int wMin, int wMax)
{
  int wSet;
  int wSetLast = -1;

  while (!start_button())
    {
    wSet = ScaleKnob(wMin, wMax);
    if (wSet != wSetLast)
      {
      wSetLast = wSet;
      printf("%s: %d\n", st, wSet);
      }
    }

  while (start_button());
  return wSet;
}

int ScaleKnob(int wMin, int wMax)
{
  return MultDiv(knob(), wMax-wMin, 255) + wMin;
}

int MultDiv(int w1, int w2, int w3)
{
  return (int) ((float) w1 * (float) w2/ (float) w3);
}

int WProportion(int wIn, int wInMin, int wInMax, int wOutMin, int wOutMax)
{
  int w;

  if (wIn <= wInMin) return wOutMin;
  if (wIn >= wInMax) return wOutMax;
  w = MultDiv(wIn - wInMin, wOutMax-wOutMin, wInMax-wInMin) + wOutMin;
  return w;
}

void DebugStop(char st[])
{
  if (!fAssertEnable) return;
  PromptFor(st);
}

void PromptFor(char st[])
{
  printf("Press Start: %s\n", st);
  StartPress();
}

void StartPress()
{
  beep();beep();beep();
  while (!start_button());
  while (start_button());
}

int ipMotor;

void Setup()
{
  alloff();
  enable_encoder(0);
  enable_encoder(1);
  CompeteInit(1);
}

void CompeteInit(int fPre)
{
  enable_servos();
  Gate(0);
  if (fPre)
    {
    sleep(0.25);
    disable_servos();
    }
  fBall = 0;
  ipMotor = start_process(MotorDriver());
}

int fStalled;
int fStalling;
int fForce = 0;
int fBall = 0;
long msStall;
int cL;
int cR;
int cLLast;
int cRLast;

void InitEncoders()
{
  reset_encoder(0);
  reset_encoder(1);
  fStalled = 0;
  fBlocked = 0;
  cL = -10;
  cR = -10;
}

int sgn(int w)
{
  if (w < 0) return -1;
  if (w > 0) return 1;
  return 0;
}

/* Bumper order RR, LR, RF, LF */
int fBlocked;
int rgfBump[4];
int rgibumpMotor[4] = {1, 0, 1, 0};
int rgibumpSgn[4] = {-1, -1, 1, 1};
int rgfBlock[4];
/* 5 ticks per second - at full power - is a stalled condition */
int cStalled = 5;

void ReadEncoders()
{
  int i;

  cLLast = cL;
  cRLast = cR;
  cL = read_encoder(0);
  cR = read_encoder(1);

  /* Stalled motors */
  if (cL == cLLast && cR == cRLast)
    {
    if (!fStalling)
      msStall = mseconds() + 250L;
    fStalling = 1;
    }
  else
    fStalling = 0;

  if (fStalling && mseconds() >= msStall)
    {
    printf("Stall!\n");
    beep();beep();
    fStalled = 1;
    }

  /* Read bump sensors and do block detection */
  fBlocked = 0;
  for (i = 0; i < 4; i++)
    {
    rgfBump[i] = digital(i+12);

    if (rgfBump[i] && sgn(rgpwr[rgibumpMotor[i]]) == rgibumpSgn[i])
      {

      fBlocked = 1;
      rgfBlock[i] = 1;
      }
    else
      rgfBlock[i] = 0;
    }

  if (digital(10))
    fBall = 1;
}

int pwrMax = 100;

void Move(int cLMax, int cRMax)
{
  int sL;
  int sR;
  float tL;
  float tR;
  float tMax;
  int sLSet;
  int sRSet;
  long ms;
  long msLimit;

  printf("Move: %d, %d\n", cLMax, cRMax);
  if (fAssertEnable)
    StartPress();

  msLimit = mseconds() + 2000L;

  InitEncoders();
  
  if (cLMax < 0)
    {
    cLMax = -cLMax;
    sL = -pwrMax;
    }
  else
    sL = pwrMax;

  if (cRMax < 0)
    {
    cRMax = -cRMax;
    sR = -pwrMax;
    }
  else
    sR = pwrMax;

  while (cL < cLMax || cR < cRMax)
    {
    if (stop_button())
      break;
    ReadEncoders();
    if (FBallCapture())
      break;
    if (fStalled || fBlocked)
      {
      if (!fForce)
        {
        beep();beep();beep();
        printf("Abort Move\n");
        break;
        }
      ms = mseconds();
      if (ms >= msLimit)
        {
        beep();beep();beep();
        printf("Time out\n");
        break;
        }
      }

    if (cL >= cLMax)
      sL = 0;
    if (cR >= cRMax)
      sR = 0;
 /*   printf("L: %d, R: %d\n", cL, cR); */
    tL = Parametric(cL, cLMax);
    tR = Parametric(cR, cRMax);
    sRSet = sR;
    sLSet = sL;
    /* BUG: Can need less than 3/4 speed - also need not retart balanced
       motors when both can track the same! */
    if (tL > tR)
      sLSet = sL*3/4;
    else
      sRSet = sR*3/4;
    SetMotors(sLSet, sRSet);
    }

  SetMotors(0,0);
}

/* forward/back speeds ticks per sec - under load? */
int rgSpeed[2] = {25, 29};

/* Measure ticks per second */
void CalibrateSpeed()
{
  long msStart;
  long msEnd;
  int cForward;
  int cBack;
  int cTicks = 500;
  int i;
  int fServo;

  for (fServo = 0; fServo < 2; fServo++)
    {
    if (fServo)
      {
      enable_servos();
      Gate(0);
      printf("Servo: ");
      }
    else
      printf("No Servo: ");

    for (i = 0; i < 2; i++)
      {
      msStart = mseconds();
      Move(cTicks,cTicks);
      msEnd = mseconds();
      rgSpeed[i] = MultDiv(100, 1000, (int) (msEnd - msStart));
      printf("%d ", rgSpeed[i]);
      cTicks = -cTicks;
      sleep(1.0);
      }

    if (fServo)
      disable_servos();

    printf("\n");
    StartPress();
    }
}

/*
persistent int c360Soft = 630;
persistent int c360Hard = 270;
*/

/* Turn calibration - 0, 90, 180, 270, 360 */
persistent int rgcHard[5] = {0, 65, 144, 230, 310};
persistent int rgcSoft[5] = {0, 135, 300, 480, 644};

/* + Left, -Right */
void Hard(int deg)
{
  int c;

  c = InterpolateTicks(deg, rgcHard);  
  Move(-c, c);
}

int rgSLeft[] = {-1, 0, 0, 1};
int rgSRight[] = {0, 1, -1, 0};

void Soft(int deg, int fForward)
{
  int i;
  int c;

  i = fForward;

  if (deg < 0)
    {
    i += 2;
    deg = -deg;
    }

  c = InterpolateTicks(deg, rgcSoft);
  Move(rgSLeft[i] * c, rgSRight[i] * c);
}
int InterpolateTicks(int deg, int rgcTicks[])
{
  int fNeg = 0;
  int c;
  int icBase;
  int iTurns;
  
  if (deg < 0)
  	{
  	fNeg = 1;
  	deg = -deg;
  	}

  iTurns = deg/360;
  deg = deg % 360;
  
  icBase = deg/90;

  c = WProportion(deg, icBase*90, (icBase+1)*90, rgcTicks[icBase], rgcTicks[icBase+1]) +
  	iTurns * rgcTicks[4];
  if (fNeg)
  	c = -c;
  return c;
}


void SoftTest()
{
  PromptFor("LF");
  Soft(45, 1);
  PromptFor("LB");
  Soft(45, 0);
  PromptFor("RF");
  Soft(-45, 1);
  PromptFor("RB");
  Soft(-45, 0);
}

void HardTest()
{
	int deg;
	int degT;
	int fNeg;
	
	for (deg = 90; deg < 360; deg++)
  		for (fNeg = 0; fNeg < 2; fNeg++)
  		{
  		degT = deg;
  		if (fNeg)
  			degT = -deg;
  		printf("Hard %d\n", degT);
  		Hard(degT);
  		}
}

void BumpTest()
{
  while (1)
  {
  Soft(360, 1); BumpStatus();
  Soft(360, 0); BumpStatus();
  Soft(-360, 1); BumpStatus();
  Soft(-360, 0); BumpStatus();
  }
}

void BumpStatus()
{
  int i;

  printf("Blocked: %d ", fBlocked);
  for (i = 0; i < 4; i++)
    {
    printf("%d ", rgfBlock[i]);
    }
  printf("\n");
  StartPress();
}

/* Motor power (left/right) */
int rgpwr[2] = {0,0};
int rgpwrSet[2] = {0,0};
int rgMotor[4] = {0, 2, 1, 3};
int rgsgnMotor[4] = {1, -1, 1, -1};

/* Control 4 motors - ganged 2 on each side */
void SetMotors(int pwrL, int pwrR)
{
  rgpwrSet[0] = pwrL;
  rgpwrSet[1] = pwrR;
}

void MotorDriver()
{
  int i;
  int j;

  while (1)
    {
    for (i = 0; i < 2; i++)
      {
      if (rgpwr[i] != rgpwrSet[i])
        {
        /* Instantaneous power reductions */
/*        if (rgpwrSet[i] < rgpwr[i]) */
          rgpwr[i] = rgpwrSet[i];
/*        else
          rgpwr[i] = (3* rgpwr[i] + rgpwrSet[i])/4; */
        for (j = 0; j < 2; j++)
          motor(rgMotor[2*i+j], rgpwr[i] * rgsgnMotor[2*i+j]);
		}
      }
    msleep(25L);
    }
}

float Parametric(int x, int xMax)
{
  if (xMax == 0) return 1.0;
  return (float) x / (float) xMax;
}

int wLD;

int iSight;
#define iBlack 0
#define iMid 1
#define iWhite 2

int rgwTable[3];
int rgwWhite[3];
int rgwBlack[3];
int rgwTableMid[3] = {24, 15, 14};
int rgiTable[3];

persistent int wBlack = 30;
persistent int wWhite = 230;
persistent int wSlop = 40;
persistent int wMid = 105;

void FindLine()
{
  int iCur;
  int iProc;
  int wInit;

  DebugStop("Find Line Start");

  Lookdown();
  iCur = iSight;

  wInit = wLD;
  iProc = start_process(Move(1000,1000));

  while (iSight == iCur && !fBlocked && !fStalled && !fBall)
    {
    printf("FindLine: %d\n", iSight);
    defer();
    Lookdown();
    }
  printf("I:%d, B:%d S:%d\n", iSight, fBlocked, fStalled);
  kill_process(iProc);
  SetMotors(0,0);
  if (fBlocked || fStalled)
    Unbind();
}

int pwrTrackMin = 16;
int pwrTrackMax = 60;

#define degSeek 1

/* Assume starting well aligned to line (black on left, white on right).
   If we leave the iMid region - we return (and set fLoseTrack) */
void LineFollower()
{
  int pwrLeft;
  int pwrRight;

  InitEncoders();
 
  while (!fStalled && !fBlocked)
    {
    Lookdown();
    pwrLeft = WProportion(wLD, wBlack, wWhite, pwrTrackMax, pwrTrackMin);
    pwrRight = WProportion(wLD, wBlack, wWhite, pwrTrackMin, pwrTrackMax);
    printf("Follow: %d - %d\n", pwrRight, pwrLeft);
    SetMotors(pwrLeft, pwrRight);
    ReadEncoders();
    }
  SetMotors(0,0);
}

void CalibrateLookdown()
{
  int i;
 
  PromptFor("Over white");
  Lookdown();
  wWhite = wLD;
  for (i = 0; i < 3; i++)
    rgwWhite[i] = rgwTable[i];
  
  PromptFor("Over black");
  Lookdown();
  for (i = 0; i < 3; i++)
    rgwBlack[i] = rgwTable[i];
  wBlack = wLD;

  wSlop = (wWhite - wBlack)/5;
  wMid = (wWhite + wBlack)/2;

  for (i = 0; i < 3; i++)
    rgwTableMid[i] = (rgwWhite[i] + rgwBlack[i])/2;

  printf("%d, %d (%d slop)\n", wBlack, wWhite, wSlop);
  StartPress();

  for (i = 0; i < 3; i++)
    printf("%d-%d ", rgwWhite[i], rgwBlack[i]);
  printf("\n");

  StartPress();   
}

void LookdownTest()
{
  int cErr = 0;
  int cLook = 0;

  while (!stop_button())
    {
    cLook++;
    Lookdown();
    if (wLD < 10)
      {
      cErr++;
      }
    printf("iSight: %d wLD: %d [0-%d:%d-255] Low: %d\n", iSight, wLD, wBlack+wSlop, wWhite-wSlop, cErr);
    }
  while (stop_button());
}

int Lookdown()
{
  int wAmb;
  int i;

  wAmb = analog(4);
  DownLight(1);
  wLD = wAmb - analog(4);
  DownLight(0);
  if (wLD <= wBlack + wSlop) iSight = iBlack;
  else if (wLD >= wWhite - wSlop) iSight = iWhite;
  else iSight = iMid;

  for (i = 0; i < 3; i++)
    {
    rgwTable[i] = analog(16+i);
    if (rgwTable[i] < rgwTableMid[i])
      rgiTable[i] = iWhite;
    else
      rgiTable[i] = iBlack;
    }
}

void DownLight(int fOn)
{
  motor(4, fOn * 100);
}

/* Move recorder routines */

void RecordMove(int iirec)
{
  /* Note we don't reclaim buffer when over-recording */

  rgirecMin[iirec] = iRecNext;
  Recorder();
  rgirecMax[iirec] = iRecNext;
}

void PlayMove(int iirec)
{
  Playback(rgirecMin[iirec], rgirecMax[iirec]);
}

void Recorder()
{
  while (YesNo("Record next"))
    {
    if (iRecNext >= 100) { printf("Buffer Full\n"); return;}
    xRec[iRecNext] = read_encoder(0);
    yRec[iRecNext] = read_encoder(1);
    iRecNext++;
    }
}

void Playback(int iMin, int iMax)
{
  int i;

  for (i = iMin; i < iMax; i++)
    Move(xRec[i], yRec[i]);
}

void ServoTest()
{
  int pos;

  enable_servos();
  ServoRange();
  disable_servos();
}

void ServoRange()
{
  int pos;
  int portServ = 0;

  while (!stop_button())
    {
    if (start_button())
      {
      portServ = 1 - portServ;
      while (start_button());
      }
    pos = ScaleKnob(30, 3960);
    printf("Servo: %d\n", pos);
    servo(portServ, pos);
    }
  while (stop_button());
}


void CalibrateGate()
{
  int i;

  PromptFor("Disengage Gate");

  enable_servos();
  Gate(0);
  PromptFor("Re-engage at top");
  printf("Testing...");
  for (i = 3; i >= 0; i--)
    {
    printf("%d", i);
    sleep(1.0);
    }
  printf("\n");
  for (i = 0; i < 5; i++)
    {
    Gate(1);
    sleep(5.0);
    Gate(0);
    sleep(1.0);
    }
  disable_servos();  
}

int fGateDown;
int rgcGate[4] = {2233, 939, 1586, 2927};
/* Straight up, and horizontal settings */
int rgcAngle[4] = {2819, 1031, 970, 2896};

void Gate(int fDown)
{
  int i;

  for (i = 0; i < 2; i++)
    {
    servo(i, rgcGate[i*2 + fDown]); 
    }
  fGateDown = fDown;
}

void GatePos(int deg)
{
  int i;

  for (i = 0; i < 2; i++)
  	{
  	servo(i, WProportion(deg, 0, 90, rgcAngle[2*i], rgcAngle[2*i+1]));
  	}
}

int FBallCapture()
{
  if (fBall && !fBallRelease && !fGateDown)
    {
    Gate(1);
    return 1;
    }
  return 0;
}

void Spinner()
{
  int i;
  int deg;

  deg = WSetting("Degrees", 10, 360);

  for (i = 0; i < 10; i++)
    {
    Hard(deg);
    Hard(-deg);
    }
}

void Shaker()
{
  int i;
  int dist;
  int ms;

  dist = WSetting("Clicks", 1, 100);
  ms = WSetting("Pause (ms)", 0, 1000);

  for (i = 0; i < 10; i++)
    {
    Move(dist, dist);
    if (ms) msleep((long) ms);
    Move(-dist, -dist);
    if (ms) msleep((long) ms);
    } 
}

void Placebo()
{
	int i;
	
  ir_transmit_off();
  fAssertEnable = YesNo("Debug");
  kill_process(ipMotor);
  if (YesNo("Start Light"))
    start_machine(START_LIGHT_PORT);
  ipMotor = start_process(MotorDriver());
  CompeteInit(0);
  Orient();

	FindLine();

  while (1)
  	{
  	Hard(90);
  	Move(-100, -100);
  	Move(80, 80);
  	Hard(90);
  	Move(-200, -200);
  	msleep(1000L);
  	Chop(3);
  	Move(50, 50);
  	Wheelie();
  	}
}

void Chop(int iMax)
{
 int i;
 for (i = 0; i < iMax; i++)
  	{
  	GatePos(0); Move(5, 5); GatePos(90); Move(-5, -5);
  	}
}

void Wheelie()
{
  GatePos(90);
  Move(60,60);
  GatePos(0);
  Move(-40, -40); Move(1000, 1000);
  msleep(1000L);
  Unbind();
}

