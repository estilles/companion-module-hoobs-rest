const instance_skel = require('../../../instance_skel');

const { Http } = require('./utils');
const { HoobsController } = require('./controller');

const actions = require('./actions');
const configs = require('./configs');
const constants = require('./constants');

class HoobsInstance extends instance_skel {
    constructor(system, id, config) {
        super(system, id, config);

        Object.assign(this, {
            ...actions,
            ...configs,
            ...constants,
        });

        this.accessories = [];
        this.config = config;
        this.initConstants();
    }

    init() {
        const http = new Http(this.system);

        this.controller = new HoobsController(this.config, http);
        this.controller.subscribe('log', (message) => this.logMessage(message));

        this.initHoobs();
    }

    updateConfig(config) {
        this.config = config;
        this.controller.updateConfig(config);

        this.initHoobs();
    }

    initHoobs() {
        if (this.config.host && this.config.port) {
            this.status(this.STATUS_UNKNOWN, 'Connecting ...');
            this.controller.getAccessories()
                .then(accessories => {
                    this.accessories = accessories;
                    this.initActions();
                    this.status(this.STATUS_OK);
                })
                .catch(({ error }) => {
                    this.log('error', error);
                    this.status(this.STATUS_ERROR, error);
                });
        } else {
            this.logMessage({ level: 'warn', message: 'Configuration is missing host or port' }, this.STATUS_ERROR);
        }

    }

    destroy() {
        this.controller.destroy();
    }

    logMessage({ level, message }, status = this.STATUS_WARNING) {
        this.log(level, message);
        this.status(status, message);
    }

}

module.exports = HoobsInstance;
