

export class PayloadItem {

    key: string;
    value: string;

    getObj() {
        return {
            key: this.key,
            value: this.value
        };
    }
}