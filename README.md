# Cooker Card

Animated Home Assistant Lovelace card for kitchen appliances driven by an enum status
sensor (air fryers, rice cookers, and similar MIoT-style devices). Reusable across
multiple appliances the same way `proxmox-card` is reused across multiple nodes —
one component, configured per device.

## Installation

Add this repository to HACS as a custom **Dashboard** repository and install it.

```yaml
type: custom:cooker-card
entity: sensor.xiaomi_de_874869297_maf65_status_p_2_1
name: Air Fryer 6.5L
icon: mdi:air-fryer
accent: "#ff8a00"
primary:
  entity: number.xiaomi_de_874869297_maf65_target_temperature_p_2_4
  label: temperatură țintă
left_time: sensor.xiaomi_de_874869297_maf65_left_time_p_2_5
fault: sensor.xiaomi_de_874869297_maf65_fault_p_2_2
selects:
  - entity: select.xiaomi_de_874869297_maf65_mode_p_2_8
    name: Mod
  - entity: select.xiaomi_de_874869297_maf65_texture_p_2_16
    name: Textură
switches:
  - entity: switch.xiaomi_de_874869297_maf65_preheat_p_2_9
    name: Preîncălzire
  - entity: switch.xiaomi_de_874869297_maf65_auto_keep_warm_p_2_6
    name: Menține cald
actions:
  - entity: button.xiaomi_de_874869297_maf65_start_cook_a_2_1
    name: Start
    icon: mdi:play
    primary: true
  - entity: button.xiaomi_de_874869297_maf65_pause_a_2_3
    name: Pauză
    icon: mdi:pause
  - entity: button.xiaomi_de_874869297_maf65_cancel_cooking_a_2_2
    name: Anulează
    icon: mdi:stop
```

`primary` is optional — when set it draws the round dial (temperature or time,
whatever numeric `number.*` entity you point it at) with +/- controls. `left_time`
accepts a sensor in minutes or seconds (auto-converted). `selects` render as native
dropdowns bound to `select.*` entities, `switches` as toggle chips, `actions` as
buttons that call `button.press`.

## License

MIT
