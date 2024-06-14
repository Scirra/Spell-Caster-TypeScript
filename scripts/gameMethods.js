// Import globals and utilities
import Globals from "./globals.js";
import * as Utils from "./utilities.js";
// TypeScript note: import the GoblinInstance class so it can be used as a type
import GoblinInstance from "./goblin.js";
export function Tick(runtime) {
    // The tick event runs every frame. The game needs to be advanced
    // by the amount of time in delta-time, also known as dt.
    const dt = runtime.dt;
    // First handle the player's movement.
    MovePlayer(runtime);
    // Next handle all goblin's movement. Note this calls a method in
    // the custom GoblinInstance class defined in goblin.js.
    // TypeScript note: iterate Goblin instances as the custom GoblinInstance class.
    for (const goblinInstance of runtime.objects.Goblin.instances()) {
        goblinInstance.Move();
    }
    // Next handle all spell's movement, and test for collisions
    // with goblins.
    for (const spellInstance of runtime.objects.Spell.instances()) {
        MoveSpell(spellInstance, dt);
        CheckSpellHitGoblin(spellInstance, runtime);
        // If a spell goes outside the layout, destroy it.
        // This is similar to the 'Destroy outside layout' behavior.
        if (Utils.IsOutsideLayout(spellInstance))
            spellInstance.destroy();
    }
    // Make any spark flashes gradually fade out.
    for (const sparkInstance of runtime.objects.SparkFlash.instances()) {
        FadeSparkFlash(sparkInstance, dt);
    }
    // Finally, always display score in the status text object.
    const statusTextInstance = runtime.objects.Status.getFirstInstance();
    statusTextInstance.text = "Score: " + Globals.score;
}
function MovePlayer(runtime) {
    // Use a playerInst local variable as a shorthand way to refer to
    // the playerInstance global variable in this function, since
    // it is used many times. Similarly create local variables to
    // reference runtime.keyboard and runtime.dt.
    const playerInst = Globals.playerInstance;
    const dt = runtime.dt;
    const keyboard = runtime.keyboard;
    // The player is destroyed if a goblin catches them. Don't try to
    // handle the player movement if the only instance was destroyed.
    if (!playerInst)
        return;
    // Check if any arrow keys are down and move the player accordingly.
    // NOTE: the 8 direction behavior normally applies acceleration and
    // ensures the diagonal speed does not go above the maximum speed.
    // This is left out/ to keep the example simple. Improving the
    // movement is left as an exercise to the reader.
    const playerSpeed = 200;
    if (keyboard.isKeyDown("ArrowRight"))
        playerInst.x += playerSpeed * dt;
    if (keyboard.isKeyDown("ArrowLeft"))
        playerInst.x -= playerSpeed * dt;
    if (keyboard.isKeyDown("ArrowDown"))
        playerInst.y += playerSpeed * dt;
    if (keyboard.isKeyDown("ArrowUp"))
        playerInst.y -= playerSpeed * dt;
    // Bound the player to the layout area so they can't go outside it.
    // This is similar to the 'Bound to layout' behavior.
    if (playerInst.x < 0)
        playerInst.x = 0;
    if (playerInst.y < 0)
        playerInst.y = 0;
    if (playerInst.x > runtime.layout.width)
        playerInst.x = runtime.layout.width;
    if (playerInst.y > runtime.layout.height)
        playerInst.y = runtime.layout.height;
    // Always scroll to the player
    runtime.layout.scrollTo(playerInst.x, playerInst.y);
    // Always make the player look in the direction of the mouse cursor
    const mouse = runtime.mouse;
    playerInst.angle = Utils.angleTo(playerInst.x, playerInst.y, mouse.getMouseX(), mouse.getMouseY());
}
function MoveSpell(inst, dt) {
    // Move spells forward at their angle at a speed of 600 pixels per second.
    // This is similar to the Bullet behavior's movement.
    const speed = 600;
    inst.x += Math.cos(inst.angle) * speed * dt;
    inst.y += Math.sin(inst.angle) * speed * dt;
}
function CheckSpellHitGoblin(spellInstance, runtime) {
    // Save a reference to the SparkFlash object type to help
    // keep the code short and readable.
    const SparkFlash = runtime.objects.SparkFlash;
    // Check if a spell has collided with any goblin. To do this it
    // must check against every Goblin instance. This is similar to
    // what the 'Is overlapping' condition does.
    for (const goblinInstance of runtime.objects.Goblin.instances()) {
        // Test if the spell instance overlaps this goblin instance,
        // indicating a collision.
        if (spellInstance.testOverlap(goblinInstance)) {
            // A collision happened: create a spark flash, and set it
            // to a random angle to vary the effect,
            const sparkFlashInstance = SparkFlash.createInstance("Main", spellInstance.x, spellInstance.y);
            sparkFlashInstance.angleDegrees = runtime.random() * 360;
            // Destroy the spell, and increase the speed counter so
            // the next spawned goblin is a little faster.
            spellInstance.destroy();
            Globals.goblinSpeed++;
            // Subtract 1 from the goblin's health. If the health
            // has then fallen to 0, destroy it as well. Remember
            // that goblin instances use the GoblinInstance class
            // defined in goblin.js, and "DestroyWithSparkFlash" is
            // defined as a method in that class.
            goblinInstance.health--;
            if (goblinInstance.health <= 0)
                goblinInstance.DestroyWithSparkFlash();
        }
    }
}
function FadeSparkFlash(inst, dt) {
    // Fade out spark flashes over 0.5 seconds, and destroy it once it
    // becomes invisible. This is similar to the Fade behavior.
    inst.opacity -= 2 * dt;
    if (inst.opacity <= 0)
        inst.destroy();
}
export function OnMouseDown(e, runtime) {
    // The left mouse button is number 0. Ignore any other mouse buttons.
    if (e.button !== 0)
        return;
    const playerInst = Globals.playerInstance;
    // Don't try to shoot if the player was destroyed.
    if (!playerInst)
        return;
    // Create a spell at player's image point 1, which is by their hand.
    const spellInstance = runtime.objects.Spell.createInstance("Main", playerInst.getImagePointX(1), playerInst.getImagePointY(1));
    // Set the spell angle to the same angle as the player, so it shoots
    // out in the right direction.
    spellInstance.angle = playerInst.angle;
}
export function OnKeyDown(e, runtime) {
    // Pressing space when the player is destroyed restarts the game.
    if (!Globals.playerInstance && e.key === " ") {
        // Also reset globals.
        Globals.score = 0;
        Globals.goblinSpeed = 80;
        // Restarting is done by using goToLayout() to go to the same layout.
        runtime.goToLayout(0);
    }
}
