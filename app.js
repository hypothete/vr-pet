(function (Vue, AFRAME, TWEEN) {

  Vue.config.devtools = true;

  'use strict';

  Vue.component('progressBar', {
    template: '#progress-bar',
    props: ['value', 'min', 'max','name', 'width', 'height'],
    computed: {
      scaleValue: function () {
        let value = this.width * this.value / (this.max - this.min);
        return value > 0 ? value : 0 ;
      }
    }
  });

  Vue.component('creature', {
    template: '#creature2',
    data: function () {
      return {
        time: Date.now(),
        timer: null,
        state: 'idle',
        stateLock: false,
        max: 100,
        name:'buzz',
        birth: Date.now(),
        ageLength: 60000,
        health: 100,
        hunger: 0,
        happy: 50,
        obey: 10,
        sleep: 100,
        toilet: 10,
        interact: Date.now(),
        x: 0,
        y: 1,
        z: -5,
        aPosition: [0,0,0],
        aSpeechBubble: false,
        showMenu: false,
        moving: false,
        velocity: [0,0,0]
      };
    },
    computed: {
      age: function () {
        return this.time - this.birth;
      },
      dead: function () {
        var dead = {
          starved: (this.hunger > this.max),
          illness: (this.health < 0),
          sadness: (this.happy < 0),
          oldage: (this.age > this.ageLength * 5),
          nosleep: (this.sleep < 0)
        };
        var somedead = false;
        for(var reason in dead) {
          if(dead[reason]) {
            this.setState(reason, true);
            somedead = true;
          }
        }
        return somedead;
      },
      stage: function () {
        if (this.age > 4 * this.ageLength) {
          return 'Senior';
        }
        if (this.age > 3 * this.ageLength) {
          return 'Adult';
        }
        else if (this.age > 2 * this.ageLength) {
          return 'Teen';
        }
        else if (this.age > 1 * this.ageLength) {
          return 'Child';
        }
        else {
          return 'Baby';
        }
        //consider switching to an array for names
      },
      scale: function () {
        return Math.ceil(this.age / this.ageLength);
      },
      aScale: function () {
        return this.scale + ' ' + this.scale + ' ' + this.scale;
      },
      aFace: function () {
        return '#'+this.stage;
      }
    },
    methods: {
      setState: function (name, dead) {
        this.state = name;
        this.aSpeechBubble = true;
        dead = dead || false;
        if (dead) return;
        setTimeout(() => {
          this.state = 'idle';
          this.aSpeechBubble = false;
        }, 5000);
      },
      tick: function ( ) {
        if (!this.dead) {
          this.time = Date.now();
          this.sleepTick();
          this.poopTick();
          this.foodTick();
          this.boredTick();
          this.healthTick();
        }
      },
      sleepTick: function () {
        this.sleep -= 1;
      },
      poopTick: function () {
        this.toilet ++;
        if (this.toilet > this.max) {
          this.health -= this.max/10;
          this.setState('pooping');
          this.toilet = this.max/4;
        }
      },
      foodTick: function () {
        this.hunger ++;
        if (this.hunger > this.max * 0.75) {
          this.setState('hungry');
        }
      },
      boredTick: function () {
        let interDiff = Date.now() - this.interact;
        if (interDiff > 60000) {
          this.setState('bored');
          this.happy -= this.max/10;
          this.obey -= this.max/10;
        }
      },
      healthTick: function () {
        let sick = (this.toilet > this.max) ||
            (this.hunger < 0);
        if (sick) {
          this.health -= this.max/20;
          this.setState('sick');
        }
      },
      doInteract: function () {
        this.interact = Date.now();
      },
      doFeed: function (e) {
        e.stopPropagation();
        this.doInteract();
        this.hunger -= this.max/5;
        this.happy += this.happy > this.max ? 0 : this.max/20;
        this.obey += this.max/50;
        this.setState('eating');
      },
      doSleep: function (e) {
        e.stopPropagation();
        this.doInteract();
        let exp = Math.random() * (this.obey + this.max - this.sleep);
        if (exp > this.max / 2) {
          //some waiting function
          this.setState('sleeping');
          this.sleep = 0;
          this.happy += this.max/5;
        }
        else {
          this.setState('wontsleep');
          this.obey -= this.max/5;
        }
      },
      doPoop: function (e) {
        e.stopPropagation();
        this.doInteract();
        if (this.toilet > this.max/2) {
          this.setState('pooping');
          this.toilet = 0;
          this.obey += this.max/10;
        }
        else {
          this.setState('wontpoop');
        }
      },
      doScold: function (e) {
        e.stopPropagation();
        this.doInteract();
        this.happy -= this.max/10;
        this.obey += this.max;
        this.setState('scolded');
      },
      doHeal: function (e){
        e.stopPropagation();
        this.doInteract();
        if  (this.health < this.max) {
          this.health += this.max/50;
          this.setState('healing');
        }
      },
      doMove: function (e) {
        e.stopPropagation();
        this.aMove(this.x + Math.random()*1-0.5,this.y,this.z + Math.random()*1-0.5);
      },
      toggleMenu: function () {
        this.showMenu = !this.showMenu;
      },
      aMove: function (newX, newY, newZ) {
        let vm = this;
        let tweenObj = {x:vm.x,y:vm.y,z:vm.z};
        new TWEEN.Tween(tweenObj)
        .to({x:newX,y:newY,z:newZ}, 500)
        .onUpdate(function () {
          vm.aPosition = [tweenObj.x, tweenObj.y, tweenObj.z].join(' ');
        })
        .onComplete(function () {
          vm.x = newX;
          vm.y = newY;
          vm.z = newZ;
        })
        .start();

        function animate () {
          if (TWEEN.update()) {
            requestAnimationFrame(animate);
          }
        }

        animate();
      }
    },
    created: function () {
      this.timer = setInterval(this.tick, 1000);
      this.aPosition = [this.x, this.y, this.z].join(' ');
    }
  });

  var app = new Vue ({
    el: '#app',
    components: [
      'creature'
    ]
  });

})(window.Vue, window.AFRAME, window.TWEEN);
