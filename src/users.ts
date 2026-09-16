class UsersService {

    private constructor() { }

    private static instance: UsersService

    public static getInstance(): UsersService {
        if (!this.instance) {
            this.instance = new UsersService()
        }
        return this.instance
    }



}
