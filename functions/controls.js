// @ts-check

function keyboardMovement(controller, ship, showBounding, gameOverCondition) {
    window.onkeydown = function (e) {
        switch (e.keyCode) {
            //key A or LEFT
            case 65:
            case 37:

                controller.setLeftTurn(true);

                break;

            //key W or UP
            case 87:
            case 38:

                ship.accel = true;
                ship.decel = false;
                controller.setAccel(true);
                controller.setDecel(false);
                break;

            //key D or RIGHT
            case 68:
            case 39:
                controller.setRightTurn(true);

                break;

            //key S or DOWN
            case 83:
                controller.setFlip(true);
                break;
            case 40:
                // reverse angle

                break;

            // key X 
            case 88:
                ship.decel = true;
                controller.setDecel(true);

                break;

            //key Space
            case 32:

                ship.fireGun = true;
                controller.setFireGun(true);

                break;
            // key Tab
            case 9:
                controller.setTarget(true);
                break;

            case 66:

                showBounding = !showBounding;

                break;
            case 13:
                if (gameOverCondition == true) {
                    window.location.reload();
                }

            case 67:
                const keyboard = document.getElementById('keyboard');
                keyboard?.classList.toggle("visibility-toggle");
                break;
            case 79:
                const display = document.getElementById('display');
                display?.classList.toggle("visibility-toggle");

                break;

        }

        e.preventDefault();
    };

    window.onkeyup = function (e) {
        switch (e.keyCode) {
            //key A or LEFT
            case 65:
            case 37:

                controller.setLeftTurn(false);

                break;

            //key W or UP
            case 87:
            case 38:

                ship.accel = false;
                controller.setAccel(false);
                // acceleration = 0;

                break;

            //key D or RIGHT
            case 68:
            case 39:

                controller.setRightTurn(false);
                break;

            //key S or DOWN
            case 83:

                controller.setFlip(false);
                break;
            case 40:


                break;

            case 88:
                ship.decel = false;
                controller.setDecel(false);

            //key Space
            case 32:

                ship.fireGun = false;
                controller.setFireGun(false);

                break;
            case 9:
                controller.setTarget(false);
                break;
        }

        e.preventDefault();
    };
}

class Controller {
    constructor() {
        this.keyboardMovement = keyboardMovement;
        this.fireGun = false;
        this.decel = false;
        this.accel = false;
        this.rightTurn = false;
        this.leftTurn = false;
        this.showBounding = false;
        this.flip = false;
        this.target = false;
        this.setAccel = this.setAccel.bind(this);
        this.setDecel = this.setDecel.bind(this);
        this.setFireGun = this.setFireGun.bind(this);
        this.setRightTurn = this.setRightTurn.bind(this);
        this.setLeftTurn = this.setLeftTurn.bind(this);
        this.toggleShowBounding = this.toggleShowBounding.bind(this);
        this.setFlip = this.setFlip.bind(this);
        this.setTarget = this.setTarget.bind(this);
    }

    setAccel = (accel) => {
        this.accel = accel;
    }

    setDecel = (decel) => {
        this.decel = decel;
    }

    setFireGun = (fireGun) => {
        this.fireGun = fireGun;
    }

    setRightTurn = (rightTurn) => {
        this.rightTurn = rightTurn;
    }

    setLeftTurn = (leftTurn) => {
        this.leftTurn = leftTurn;
    }

    setFlip = (flip) => {
        this.flip = flip;
    }

    toggleShowBounding = () => {
        this.showBounding = !this.showBounding;
    }

    setTarget = (target) => {
        this.target = target;
    }
}
