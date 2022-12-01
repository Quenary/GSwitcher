import * as fs from 'fs';
import * as path from 'path';
import { BehaviorSubject, debounceTime, Observable, skip } from 'rxjs';

export interface IGSwitcherConfig {
    /**
     * Наименование дисплеев, к которым применяются настройки
     */
    displays: string[];
    /**
     * Конфиги приложений
     */
    applications: {
        [key: string]: IGSwitcherConfigApplication;
    };
}

/**
 * Конфиг приложения
 */
export interface IGSwitcherConfigApplication {
    brightness: number;
    contrast: number;
    gamma: number;
}

/**
 * Класс хранилища
 */
export class GSwitcherStorage {

    private readonly settingsPath = path.join(__dirname, './settings.json');
    private readonly defaultConfig: IGSwitcherConfig = {
        displays: [],
        applications: {}
    };

    private readonly config$ = new BehaviorSubject<IGSwitcherConfig>(null);

    constructor() {
        const isConfig = fs.existsSync(this.settingsPath);
        if (!isConfig) {
            this.setConfig(this.defaultConfig);
            this.writeConfig(this.defaultConfig);
        }
        else {
            this.setConfig(
                this.readConfig()
            );
        }
        this.config$
            .pipe(
                skip(1),
                debounceTime(1000)
            )
            .subscribe(conf => this.writeConfig(conf));
    }

    /**
     * Get observable of config
     */
    public observeConfig(): Observable<IGSwitcherConfig> {
        return this.config$.asObservable();
    }

    /**
     * Get config object
     */
    public getConfig(): IGSwitcherConfig {
        return this.config$.getValue();
    }

    /**
     * Set config object
     * @param config config
     */
    public setConfig(config: IGSwitcherConfig): void {
        this.config$.next(config);
    }

    /**
     * Reads config from file
     */
    private readConfig(): IGSwitcherConfig {
        return JSON.parse(
            fs.readFileSync(this.settingsPath, { encoding: 'utf-8' })
        );
    }

    /**
     * Writes config to file
     * @param config config
     */
    private writeConfig(config: IGSwitcherConfig): void {
        fs.writeFileSync(this.settingsPath, JSON.stringify(config, null, 2));
    }

    /**
     * Set config key
     * @param key Key
     * @param value Value
     */
    public setKeyValue
        <K extends keyof IGSwitcherConfig>
        (
            key: K,
            value: IGSwitcherConfig[K]
        ): void {
        const cfg = this.getConfig();
        cfg[key] = value;
        this.setConfig(cfg);
    }

    /**
     * Saves application's configuration
     * @param appName application name
     * @param config configuration
     */
    public setApplicationData(appName: string, config: IGSwitcherConfigApplication): void {
        if (!appName || !config || Object.values(config).find(value => !value)) {
            return;
        }
        const cfg = this.getConfig();
        cfg.applications[appName] = config;
        this.setConfig(cfg);
    }
}