import {
	Region,
	Zone
} from "../api"

Zone.onUse("plantation-hatch", () => Region.load("boiler"))
