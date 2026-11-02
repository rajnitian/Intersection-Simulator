# Model notes and limitations

## Signal timing
The prototype estimates a two-phase cycle using the Webster form `C0 = (1.5L + 5) / (1 - Y)`, where `L` is total lost time per cycle and `Y` is the sum of the critical flow ratios for the NS and EW phase groups. It applies a 40–180 s practical clamp and a 7 s minimum green per phase. These are explicit prototype assumptions, not universal standard values.

## Signal sequence
NS green → NS amber → all-red → EW green → EW amber → all-red. The animation phase timer uses the estimated phase durations. The 3D scene currently demonstrates stop/go movement and spacing visually; it is not a validated conflict-area occupancy or dilemma-zone model.

## Vehicle and traffic assumptions
Vehicle classes are visually differentiated. The current 3D demo uses synthetic vehicle generation and simplified straight-through trajectories. It does not yet model calibrated turning proportions, mixed-traffic lateral positioning, lane-changing, pedestrian phases, emergency pre-emption, roundabouts, or realistic network routing.

## Engineering caution
Do not use the outputs as a final design recommendation. Calibrate saturation flow, PCU equivalents, lane-group critical flows, lost time, amber and all-red intervals, vehicle dimensions, headways, and geometry against local standards and field observations. Have a qualified traffic engineer review any design application.
