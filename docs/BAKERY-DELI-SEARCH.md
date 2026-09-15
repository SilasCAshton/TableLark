# Bakery and deli matching

Searches use a dedicated post-search check for primary types bakery and deli.
There is no general preset attribute-rule configuration.

In Everything and Pizza & Sandwiches, a bakery qualifies with an associated
cafe, coffee_shop, restaurant, breakfast_restaurant, brunch_restaurant, or
sandwich_shop type, OR an explicitly true breakfast, brunch, lunch, or dinner
service attribute. Delis use the same rules except coffee_shop alone does not
qualify them.

Coffee & Breakfast uses a narrower check: an associated cafe, coffee_shop,
breakfast_restaurant, or brunch_restaurant type, OR explicitly true breakfast
or brunch service. Lunch-only evidence does not qualify.

Other primary types are unchanged. Generic food/store labels do not qualify.
Missing or false meal attributes do
not qualify, but a matching associated type can still qualify a place.
Seating and takeaway are not requirements.

Only presets explicitly searching bakery or deli request the extra types and
meal-service fields. Those meal-service fields
trigger Google's Enterprise + Atmosphere pricing. No extra API calls are added.

Both Popular and Hidden Gems apply the check after result collection. Hidden
Gems still uses original candidate counts for subdivision and keeps its eight
request cap. Results are not refilled after filtering.
