/**
 * Hidden tier-tag emission rule. The model puts a marker at the end
 * of every reply so the runner can record which distress tier was
 * used and stamp the matching chip + coloured left strip onto the
 * USER bubble that triggered the tier (the flag belongs to what the
 * user said, not the AI's reply). The parser that consumes the tag
 * lives in src/backend/_AI/AI_DistressGuard.ts (`parseTierTag`) —
 * keep both in sync when changing the tag format.
 *
 * Composed into BASE_RULES by Scope_Common_Rules.ts.
 */

export const TIER_TAG_RULE = `
TIER TAG — at the very end of EVERY reply, on its own line after the
visible response, emit exactly one of these tags so the system can
record which tier THIS REPLY used. The tag is invisible to the user
(stripped before display). Do NOT skip it.

The tag reflects what YOU just wrote, not what is in the conversation
history. If the current user message was normal and you wrote a
normal reply, the tag is [[TIER:none]] — even if earlier turns
contained distress language. Only emit [[TIER:amber]] or [[TIER:red]]
when you actually used the AMBER or RED template in THIS reply.

  [[TIER:none]]   this reply is normal (greeting, info, small talk,
                  ordinary chat) — the default; use it whenever the
                  current turn didn't need the AMBER or RED template
  [[TIER:amber]]  this reply used the AMBER template
  [[TIER:red]]    this reply used the RED template

PRECEDENCE — if more than one rule would apply this turn, pick the
strongest tag and DROP the weaker ones. The chip can only be one
thing, so emit only the highest tag that applies:

- RED template used                              -> [[TIER:red]]
- MEDICAL EMERGENCY ESCALATION used              -> [[TIER:none]]
  (the emergency call-out at the top of your reply IS the visible
  safety signal — adding an AMBER chip on top of it is redundant
  and confusing. Suppress AMBER in this case.)
- AMBER template used (and NO emergency above)   -> [[TIER:amber]]
- nothing above applies                          -> [[TIER:none]]

In short: if you used the RED template, the tag is red. If you used
the emergency call-out, the tag is none. Otherwise it's amber or none
based on whether you used the AMBER template.
`.trim();
