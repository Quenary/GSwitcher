const ffi = require('ffi-napi');
const ref = require('ref-napi');
const systeminformation = require('systeminformation');
const StructType = require('ref-struct-napi');
const ArrayType = require('ref-array-napi');
const getBuffer = text => Buffer.from(`${text}\0`, "ucs2");

const uint16 = ref.types.uint16;
const RAMP = StructType({
    Red: ArrayType(uint16, 256),
    Green: ArrayType(uint16, 256),
    Blue: ArrayType(uint16, 256),
});
const defaultRamp = new RAMP;
const defaultRampObj = {
    Red: [],
    Green: [],
    Blue: []
};

const gdi32 = ffi.Library(
    'gdi32',
    {
        DeleteDC: [
            ref.types.bool, [
                ref.types.int
            ]
        ],
        CreateDCA: [
            ref.types.int, [
                ref.types.CString,
                ref.types.CString,
                ref.types.CString,
                ref.types.int
            ]
        ],
        CreateDCW: [
            ref.types.int, [
                ref.types.CString,
                ref.types.CString,
                ref.types.CString,
                ref.types.int
            ]
        ],
        GetDeviceGammaRamp: [
            ref.types.bool, [
                ref.types.int,
                ref.refType(RAMP)
            ]
        ],
        SetDeviceGammaRamp: [
            ref.types.bool, [
                ref.types.int,
                ref.refType(RAMP)
            ]
        ]
    }
)

async function prepareRamps() {
    let DC = null;
    try {
        const graphics = await systeminformation.graphics();
        const display = graphics.displays[0];
        const name = display.deviceName.substring(
            display.deviceName.indexOf('.') - 2
        );
        DC = gdi32.CreateDCW(ref.NULL, getBuffer(name), ref.NULL, 0);
        console.log(`Device context for ${name} is ${DC}`);

        const gammaRes = gdi32.GetDeviceGammaRamp(DC, defaultRamp.ref());
        defaultRampObj.Red = defaultRamp.Red.toString().split(',');
        defaultRampObj.Green = defaultRamp.Green.toString().split(',');
        defaultRampObj.Blue = defaultRamp.Blue.toString().split(',');
    }
    catch (e) {
        console.error(e);
    }
    finally {
        if (DC != null) {
            gdi32.DeleteDC(DC);
        }
        console.log(defaultRamp)
        console.log(defaultRampObj)
    }
}
prepareRamps();

const calculateRampValues = (brightness = 0.5, contrast = 0.5, gamma = 2.8) => {
    const uintMaxValue = 65535;
    const dataPoints = 256;
    // Limit gamma in range [0.4-2.8]
    gamma = Math.min(Math.max(gamma, 0.4), 2.8);
    // Normalize contrast in range [-1,1]
    contrast = (Math.min(Math.max(contrast, 0), 1) - 0.5) * 2;
    // Normalize brightness in range [-1,1]
    brightness = (Math.min(Math.max(brightness, 0), 1) - 0.5) * 2;
    // Calculate curve offset resulted from contrast
    let offset = contrast > 0 ? contrast * -25.4 : contrast * -32;
    // Calculate the total range of curve
    const range = (dataPoints - 1) + offset * 2;
    // Add brightness to the curve offset
    offset += brightness * (range / 5);
    // Fill the gamma curve
    let res = [];
    for (let i = 0; i < dataPoints; i++) {
        let factor = (i + offset) / range;
        factor = factor ** (1 / gamma);
        factor = Math.min(Math.max(factor, 0), 1);
        res.push(Math.round(factor * uintMaxValue));
    }
    return res;
}

console.log(calculateRampValues()[17]);