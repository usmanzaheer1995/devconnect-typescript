export interface IProfile {
    user: string;
    company?: string;
    website?: string;
    location?: string;
    status: string;
    skills: [string];
    bio?: string;
    githubusername?: string;
    experiences?: [{
        title: string,
        company: string,
        location?: string,
        from?: Date,
        to?: Date,
        current?: boolean,
        description?: string,
    }];
    education?: [{
        school: string,
        degree: string,
        fieldofstudy: string,
        from: Date,
        to?: Date,
        current?: boolean,
        description?: string,
    }];
    social?: {
        youtube?: string;
        twitter?: string;
        facebook?: string;
        linkedin?: string;
        instagram?: string;
    };
    date?: Date;
}
