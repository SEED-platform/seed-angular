# Minimal inventory for the e2e tests (the stock create_and_load_sample_data command is broken on develop).
# Usage: docker compose -f e2e/docker-compose.yml exec -T web ./manage.py shell < e2e/seed-data.py
from seed.models import Cycle, Property, PropertyState, PropertyView, TaxLot, TaxLotState, TaxLotView
from seed.lib.superperms.orgs.models import Organization

org = Organization.objects.get(name="default")
cycles = list(Cycle.objects.filter(organization=org))
for cycle in cycles:
    for i in range(10):
        prop = Property.objects.create(organization=org)
        state = PropertyState.objects.create(
            organization=org,
            address_line_1=f"{100 + i} Main St",
            city="Golden",
            state="CO",
            postal_code="80401",
            property_name=f"E2E Property {cycle.id}-{i}",
            gross_floor_area=10000 + i * 500,
            year_built=1980 + i,
        )
        PropertyView.objects.create(property=prop, cycle=cycle, state=state)
        lot = TaxLot.objects.create(organization=org)
        lot_state = TaxLotState.objects.create(
            organization=org, address_line_1=f"{100 + i} Main St", city="Golden", state="CO", jurisdiction_tax_lot_id=f"E2E-{cycle.id}-{i}"
        )
        TaxLotView.objects.create(taxlot=lot, cycle=cycle, state=lot_state)
print("seeded", PropertyView.objects.filter(state__organization=org).count(), "property views")
