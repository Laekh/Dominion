package net.ultradev.dominion.game.card.action.actions;

import javax.servlet.http.HttpSession;

import net.sf.json.JSONObject;
import net.ultradev.dominion.game.Turn;
import net.ultradev.dominion.game.card.action.Action;
import net.ultradev.dominion.game.card.action.ActionResult;

public class GainBuysAction extends Action {
	
	int amount;

	public GainBuysAction(String identifier, String description, int amount) {
		super(identifier, description);
		this.amount = amount;
	}

	@Override
	public JSONObject play(Turn turn, HttpSession session) {
		JSONObject response = new JSONObject().accumulate("response", "OK");
		turn.addBuys(this.amount);
		response.accumulate("result", ActionResult.DONE);
		return response;
	}

}
