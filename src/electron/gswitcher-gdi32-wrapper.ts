import { Library } from 'ffi-napi';
import * as ref from 'ref-napi';
import * as StructType from 'ref-struct-napi';
import * as ArrayType from 'ref-array-napi';

const uint16 = ref.types.uint16;

/**
 * StructType ref "type" of LpRamp
 */
const RAMP = StructType({
    Red: ArrayType(uint16, 256),
    Green: ArrayType(uint16, 256),
    Blue: ArrayType(uint16, 256),
});

/**
 * node-ffi-napi "Library" of gdi32.dll
 */
const gdi32 = new Library(
    'gdi32',
    {
        DeleteDC: [
            ref.types.bool, [
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
);

/**
 * Display ramp interface
 */
export interface IRamp {
    Red: Array<number>;
    Green: Array<number>;
    Blue: Array<number>;
}

/**
 * Wrapper to gdi32.dll functionallity of
 * changing displays settings.
 */
export class GSwitcherGDI32Wrapper {
    /**
     * Get C buffer of js string
     */
    private getCStringBuffer(text: string) {
        return Buffer.from(`${text}\0`, "ucs2");
    }

    /**
     * Creates ramp from one array of values.
     * @param values Array of values
     * @returns Ramp
     */
    public getFlatRamp(values: Array<number>): IRamp {
        return {
            Red: values,
            Green: values,
            Blue: values
        };
    }

    /**
     * Get gamma ramps for sertain display
     * @param displayName name of display
     */
    public getDeviceGammaRamp(displayName: string): IRamp {
        const DC = this.createDCW(displayName);
        const res: IRamp = {
            Red: [],
            Green: [],
            Blue: []
        };
        const rampBuffer = new RAMP;
        const gammaRes = gdi32.GetDeviceGammaRamp(DC, rampBuffer.ref());
        if (gammaRes) {
            res.Red = rampBuffer.Red.toString().split(',');
            res.Green = rampBuffer.Green.toString().split(',');
            res.Blue = rampBuffer.Blue.toString().split(',');
        }
        this.deleteDC(DC);
        return res;
    }

    /**
     * Set display gamma ramp by name
     * @param displayName display name
     * @param ramp ramp
     * @returns true - success, false - fail
     */
    public setDeviceGammaRamp(displayName: string, ramp: IRamp): boolean {
        const dc = this.createDCW(displayName);
        const buffer = new RAMP(ramp);
        const res = gdi32.SetDeviceGammaRamp(dc, buffer.ref());
        return res;
    }

    /**
     * Normalize display name.
     * 1. Delete extra \
     */
    private normalizeDisplayName(name: string): string {
        return name?.replace('\\\\\\\\.', '\\\\.');
    }

    /**
     * Creates display context and returns its id.
     * @param displayName display name
     * @returns display context id / null on fail
     */
    private createDCW(displayName: string): number {
        displayName = this.normalizeDisplayName(displayName);
        const buffer = this.getCStringBuffer(displayName);
        const res = gdi32.CreateDCW(
            null,
            buffer as any,
            null,
            0
        );
        return res !== 0
            ? res
            : null;
    }

    /**
     * Removes display context
     * @param contextId display context id
     * @returns success/fail
     */
    private deleteDC(contextId: number): boolean {
        return gdi32.DeleteDC(contextId);
    }

    /**
     * Calculate gamma ramp array
     * based on listed parameters
     * @param brightness Brightness level (0 - 1). Default is 0.5.
     * @param contrast Contrast level (0 - 1). Default is 0.5.
     * @param gamma Gamma level (0.4 - 2.8). Default is 1.
     * @returns Array of numbers with liength of 256
     */
    public calculateRampValues(
        brightness: number = 0.5,
        contrast: number = 0.5,
        gamma: number = 1
    ): Array<number> {
        const uintMaxValue: number = 65535;
        const dataPoints: number = 256;
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
}