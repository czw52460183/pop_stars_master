/**
 * @author uu
 * @file  UI 分数控制器
 * @todo 
 */
cc.Class({
  extends: cc.Component,
  properties: {
    scorePrefab: cc.Prefab,
    scoreParticlePrefab: cc.Prefab,
    mainScoreLabel: cc.Label,
    successDialog: require('successDialog'),
    failDialog: cc.Node,
    avatarSpriteArr: [cc.SpriteFrame],
    // progressBar: require('progress'),
    // leftStepLabel: cc.Label,
  },
  init(g) {
    this._game = g
    this._controller = g._controller
    this.score = 0
    this.leftStep = this._controller.config.json.originStep
    this.chain = 1
    this.level = 1
    this.closeMultLabel()
    this.levelData = g._controller.config.json.levelData
    this.progressBar.init(0, this.levelData[this.level - 1], this.level)
    this.leftStepLabel.string = this.leftStep
    this.scoreTimer = []
    this.currentAddedScore = 0
    this.mainScoreLabel.node.active = false
    this.playerSprite.spriteFrame = this.avatarSpriteArr[this.level - 1]
  },
  start() {
    this.generatePool()
    this.bindNode()
  },
  generatePool() {
    this.scorePool = new cc.NodePool()
    for (let i = 0; i < 20; i++) {
      let score = cc.instantiate(this.scorePrefab)
      this.scorePool.put(score)
    }
    this.scoreParticlePool = new cc.NodePool()
    for (let i = 0; i < 20; i++) {
      let scoreParticle = cc.instantiate(this.scoreParticlePrefab)
      this.scoreParticlePool.put(scoreParticle)
    }
  },
  // 实例化单个方块
  instantiateScore(self, num, pos) {
    let score = null
    if (self.scorePool && self.scorePool.size() > 0) {
      score = self.scorePool.get()
    } else {
      score = cc.instantiate(self.scorePrefab)
    }
    score.parent = this.scoreContainer
    score.getComponent('scoreCell').init(self, num, pos)

    let scoreParticle = null
    if (self.scoreParticlePool && self.scoreParticlePool.size() > 0) {
      scoreParticle = self.scoreParticlePool.get()
    } else {
      scoreParticle = cc.instantiate(self.scoreParticlePrefab)
    }
    scoreParticle.parent = this.scoreContainer
    scoreParticle.getComponent('scoreParticle').init(self, pos, this._controller.config.json.scoreParticleTime)
  },
  bindNode() {
    this.playerSprite = this.node.getChildByName('UI').getChildByName('playerNode').getChildByName('Sprite').getComponent(cc.Sprite)
    this.leftStepLabel = this.node.getChildByName('UI').getChildByName('leftStepNode').getChildByName('Label').getComponent(cc.Label)
    this.progressBar = this.node.getChildByName('UI').getChildByName('scoreNode').getChildByName('progressBar').getComponent('progress')
    this.scoreContainer = this.node.getChildByName('UI').getChildByName('scoreGroup')
    this.multLabel = this.mainScoreLabel.node.getChildByName('mult').getComponent(cc.Label)
    // 失败时更新失败UI
    this.failScore = this.failDialog.getChildByName('info').getChildByName('score').getComponent(cc.Label)
    this.failName = this.failDialog.getChildByName('info').getChildByName('level').getComponent(cc.Label)
    this.failHighScore = this.failDialog.getChildByName('info').getChildByName('highScore').getComponent(cc.Label)
  },
  //--------------------- 分数控制 ---------------------
  // 增加 减少步数并且刷新UI
  onStep(num) {
    this.leftStep += num
    if (this.leftStep < 0) {
      this.leftStep = 0
      this.onGameOver()
    }
    this.leftStepLabel.string = this.leftStep
  },
  //增加分数总控制 获取连击
  addScore(pos) {
    // 一次消除可以叠chain
    if (this.chainTimer) {
      clearTimeout(this.chainTimer)
    }
    this.initCurrentScoreLabel()
    this.chainTimer = setTimeout(() => {
        this.onCurrentScoreLabel(this.currentAddedScore, {
          x: -60,
          y: 355
        }, cc.callFunc(() => {
          this.score += this.currentAddedScore * this.multiple
          if (this.score >= this.levelData[this.level - 1].score) {
            //this.score = this.score - this.levelData[this.level - 1].score
            this.level++
            this.level == 15 ? this.levelLimet() : this.onLevelUp()
          }
          this.progressBar.init(this.score, this.levelData[this.level - 1], this.level)
          this.chain = 1
          this.closeMultLabel()
          this.currentAddedScore = 0
          this.mainScoreLabel.node.active = false
        }, this))
      }, 300 / 1
      // (cc.game.getFrameRate() / 60)
    )
    this.currentAddedScore += this._controller.config.json.scoreBase * (this.chain > 10 ? 10 : this.chain)
    this.mainScoreLabel.string = this.currentAddedScore
    this.instantiateScore(this, this._controller.config.json.scoreBase * (this.chain > 10 ? 10 : this.chain), pos)
    this.chain++
  },
  addMult() {
    if (this.multiple < this._controller.config.json.maxMultiple) {
      this.multiple *= 2
      this.showMultLabel()
    }
  },
  closeMultLabel() {
    this.multiple = 1
    this.multLabel.node.active = false
  },
  showMultLabel() {
    this.multLabel.string = this.multiple
    this.multLabel.node.active = true
  },
  // 增加分数倍数
  initCurrentScoreLabel() {
    this.mainScoreLabel.node.active = true
    this.mainScoreLabel.node.x = 0
    this.mainScoreLabel.node.y = 0
    this.mainScoreLabel.node.scale = 1
  },
  onCurrentScoreLabel(num, pos, callback) {
    this.mainScoreLabel.string = num
    let action = cc.spawn(cc.moveTo(0.2, pos.x, pos.y), cc.scaleTo(0.2, 0.4)).easing(cc.easeBackOut())
    let seq = cc.sequence(action, callback)
    this.mainScoreLabel.node.runAction(seq)
  },
  onLevelUp() {
    this._controller.pageMgr.addPage(2)
    this._controller.pageMgr.addPage(3)
    this.successDialog.init(this, this.level, this.levelData) //升级之后的等级
    this._game._status = 2
  },
  levelLimet() {
    //   console.log('等级达到上限')

  },
  onLevelUpButton() {
    this._controller.pageMgr.onOpenPage(1)
    this.initCurrentScoreLabel()
    this.mainScoreLabel.string = this.level + 3
    setTimeout(() => {
      this.onCurrentScoreLabel(this.level + 3, {
        x: -248,
        y: 630
      }, cc.callFunc(() => {
        this.onStep(this.level + 3)
        this._game._status = 1
        this.mainScoreLabel.node.active = false
        this.playerSprite.spriteFrame = this.avatarSpriteArr[(this.level - 1) % 3]
      }))
    }, 300);
  },
  onGameOver() {
    if (this._game._status != 3) {
      this._game.gameOver()
      // TODO:绑定分数和其他字
      this.updateFailPage()
      if (this._controller.social.node.active) {
        // 仅上传分数
        this._controller.social.onGameOver(this.level, this.score)
      }
    }
  },
  updateFailPage() {
    this.failScore.string = "当前得分:" + (this.score + '')
    this.failName.string = this.levelData[this.level - 1].name
    //this.failHighScore.string = "正在获取您的最高分..."
  }
});