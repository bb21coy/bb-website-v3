import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from the Authorization header
            secretOrKey: process.env.JWT_SECRET,
        },
        (jwt_payload, done) => {
            return done(null, jwt_payload);
        }
    )
);

export default passport;